import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// Initialize Firebase Admin
const appAdmin = getApps().length === 0 
  ? initializeApp({ projectId: "gen-lang-client-0387723123" }) 
  : getApp();
const db = getFirestore(appAdmin, "ai-studio-1d17aef0-f9e2-48aa-bbba-ff95554e5700");

const app = express();
const PORT = 3000;

// Webhook route needs raw body for signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
  try {
    const stripeSnap = await db.collection('settings').doc('stripe').get();
    if (!stripeSnap.exists) {
      console.error('Webhook Error: Stripe is not configured in Firestore settings/stripe');
      res.status(400).send('Stripe is not configured');
      return;
    }

    const stripeData = stripeSnap.data()!;
    const secretKey = stripeData.secretKey;
    if (!secretKey) {
      console.error('Webhook Error: Secret key is missing');
      res.status(400).send('Stripe Secret Key is missing');
      return;
    }

    const stripe = new Stripe(secretKey, { apiVersion: '2025-02-18' as any });
    const sig = req.headers['stripe-signature'];
    
    let event: Stripe.Event;

    // Try signature verification or fallback to secure session API lookup
    if (sig) {
      try {
        // Look for signature verification secret if configured, otherwise fallback to unverified event + direct session retrieve validation
        const webhookSecret = stripeData.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
        if (webhookSecret) {
          event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
          event = JSON.parse(req.body.toString());
        }
      } catch (err: any) {
        console.warn('Webhook signature check failed/skipped. Parsing body.', err.message);
        event = JSON.parse(req.body.toString());
      }
    } else {
      event = JSON.parse(req.body.toString());
    }

    console.log('Stripe Webhook Received Event Type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const sessionPayload = event.data.object as Stripe.Checkout.Session;
      const sessionId = sessionPayload.id;

      // 100% DEFENSIVE: Fetch the session directly from Stripe using the Secret Key.
      // This is secure and guarantees that the session exists and is paid.
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        const orderId = session.metadata?.orderId || session.client_reference_id;
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : '';

        if (!orderId) {
          console.error('Webhook Error: Order ID not found in session metadata or client_reference_id');
          res.status(400).send('Order ID missing');
          return;
        }

        console.log(`Processing approved payment for Order: ${orderId}, Session: ${sessionId}`);

        // Update order and inventory in a Firestore Transaction
        const orderRef = db.collection('orders').doc(orderId);
        
        await db.runTransaction(async (transaction) => {
          const orderSnap = await transaction.get(orderRef);
          if (!orderSnap.exists) {
            throw new Error(`Order ${orderId} does not exist.`);
          }

          const orderData = orderSnap.data()!;

          // If payment was already processed, do not deduct stock again
          if (orderData.paymentStatus === 'paid') {
            console.log(`Order ${orderId} is already marked as Paid. Skipping.`);
            return;
          }

          const items = orderData.items || [];

          if (orderData.stockDeducted !== true) {
            console.log(`Deducting inventory stock for order items:`, items);
            // Fetch products
            const uniqueProductIds: string[] = Array.from(new Set(items.map((i: any) => i.productId as string)));
            const productDocsMap = new Map<string, { ref: any, data: any }>();

            for (const productId of uniqueProductIds) {
              const productRef = db.collection('products').doc(productId);
              const productSnap = await transaction.get(productRef);
              if (productSnap.exists) {
                productDocsMap.set(productId, { ref: productRef, data: productSnap.data() });
              }
            }

            // Deduct stock
            for (const item of items) {
              const productObj = productDocsMap.get(item.productId);
              if (!productObj) continue;

              const productData = productObj.data;
              const qty = Number(item.quantity) || 1;

              if (productData.variations && productData.variations.length > 0) {
                const size = item.attributes?.Tamanho || item.attributes?.['Tamanho'];
                const color = item.attributes?.Cor || item.attributes?.['Cor'];
                
                const varIdx = productData.variations.findIndex(
                  (v: any) => v.size === size && v.color === color
                );

                if (varIdx !== -1) {
                  const currentVarStock = Number(productData.variations[varIdx].stockQuantity) || 0;
                  productData.variations[varIdx].stockQuantity = Math.max(0, currentVarStock - qty);
                  
                  // Recalculate parent stock
                  const totalStock = productData.variations.reduce(
                    (sum: number, v: any) => sum + (Number(v.stockQuantity) || 0),
                    0
                  );
                  productData.stockQuantity = totalStock;
                } else {
                  const currentBaseStock = Number(productData.stockQuantity) || 0;
                  productData.stockQuantity = Math.max(0, currentBaseStock - qty);
                }
              } else {
                const currentBaseStock = Number(productData.stockQuantity) || 0;
                productData.stockQuantity = Math.max(0, currentBaseStock - qty);
              }
            }

            // Apply stock updates
            for (const [productId, productObj] of productDocsMap.entries()) {
              transaction.update(productObj.ref, {
                stockQuantity: productObj.data.stockQuantity,
                ...(productObj.data.variations ? { variations: productObj.data.variations } : {})
              });
            }
          }

          // Build or fetch tracking events
          let trackingEvents = orderData.trackingEvents || [];
          if (!Array.isArray(trackingEvents)) {
            trackingEvents = [];
          }
          if (!trackingEvents.some((ev: any) => ev.code === 'paid')) {
            trackingEvents.push({
              code: 'paid',
              label: 'Pagamento aprovado',
              description: 'Seu pagamento via Cartão de Crédito foi confirmado com sucesso pelo Stripe.',
              createdAt: new Date(),
            });
          }

          // Update order status
          transaction.update(orderRef, {
            paymentStatus: 'paid',
            status: 'paid',
            stripeSessionId: sessionId,
            stripePaymentIntentId: paymentIntentId,
            paymentMethod: 'stripe',
            stockDeducted: true,
            trackingEvents: trackingEvents,
            updatedAt: FieldValue.serverTimestamp()
          });
        });

        console.log(`Successfully completed order transaction for approved Stripe order: ${orderId}`);
      } else {
        console.warn(`Webhook: Session ${sessionId} exists but payment_status is not paid:`, session.payment_status);
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

// JSON and URL-encoded body parsers for non-webhook routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Retrieve public Stripe config
app.get('/api/stripe/config', async (req, res) => {
  try {
    let active = false;
    let publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
    let mode = 'sandbox';

    try {
      const docSnap = await db.collection('settings').doc('stripe').get();
      if (docSnap.exists) {
        const data = docSnap.data()!;
        active = data.active === true;
        publishableKey = data.publishableKey || publishableKey;
        mode = data.mode || mode;
      }
    } catch (err) {
      console.warn('[Stripe Server] Could not read settings/stripe from Firestore admin:', err);
    }

    // Fallback to settings/stripe_public if admin collection read failed
    if (!active || !publishableKey) {
      try {
        const docSnapPublic = await db.collection('settings').doc('stripe_public').get();
        if (docSnapPublic.exists) {
          const data = docSnapPublic.data()!;
          active = data.active === true;
          publishableKey = data.publishableKey || publishableKey;
          mode = data.mode || mode;
        }
      } catch (err) {
        console.warn('[Stripe Server] Could not read settings/stripe_public from Firestore admin:', err);
      }
    }

    // Also consider env variables
    if (process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY) {
      active = true;
      publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    }

    res.json({
      active,
      publishableKey,
      mode,
    });
  } catch (error: any) {
    console.error('Error fetching stripe config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe Checkout Session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { orderId, orderData: clientOrderData } = req.body;
    if (!orderId && !clientOrderData) {
      res.status(400).json({ error: 'Order ID or Order Data is required' });
      return;
    }

    let orderData = clientOrderData;

    if (!orderData) {
      try {
        // 1. Fetch Order details
        const orderSnap = await db.collection('orders').doc(orderId).get();
        if (orderSnap.exists) {
          orderData = orderSnap.data()!;
        }
      } catch (err) {
        console.warn('[Stripe Server] Could not read order from Firestore admin SDK:', err);
      }
    }

    if (!orderData) {
      res.status(404).json({ error: 'Order details could not be retrieved. Please provide orderData in the request body.' });
      return;
    }

    // 2. Fetch Stripe settings
    let secretKey = process.env.STRIPE_SECRET_KEY || '';
    let stripeActive = false;

    try {
      const stripeSnap = await db.collection('settings').doc('stripe').get();
      if (stripeSnap.exists) {
        const stripeConfig = stripeSnap.data()!;
        stripeActive = stripeConfig.active === true;
        if (!secretKey) {
          secretKey = stripeConfig.secretKey || '';
        }
      }
    } catch (err) {
      console.warn('[Stripe Server] Could not read settings/stripe from Firestore admin:', err);
    }

    // Fallback to settings/stripe_public if admin collection read failed
    if (!stripeActive || !secretKey) {
      try {
        const stripeSnapPublic = await db.collection('settings').doc('stripe_public').get();
        if (stripeSnapPublic.exists) {
          const stripeConfigPublic = stripeSnapPublic.data()!;
          stripeActive = stripeConfigPublic.active === true;
        }
      } catch (err) {
        console.warn('[Stripe Server] Could not read settings/stripe_public from Firestore admin:', err);
      }
    }

    // Also consider env variables
    if (process.env.STRIPE_SECRET_KEY) {
      stripeActive = true;
      secretKey = process.env.STRIPE_SECRET_KEY;
    }

    if (!stripeActive) {
      res.status(400).json({ error: 'Stripe integration is disabled or not configured.' });
      return;
    }

    if (!secretKey) {
      res.status(500).json({ error: 'Stripe configuration is missing the Secret Key.' });
      return;
    }

    // Initialize Stripe
    const stripe = new Stripe(secretKey, { apiVersion: '2025-02-18' as any });

    // 3. Build Line Items
    const items = orderData.items || [];
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      let variantName = '';
      if (item.attributes) {
        const attributesList = Object.entries(item.attributes)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        if (attributesList) {
          variantName = ` (${attributesList})`;
        }
      }

      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${item.name}${variantName}`,
            images: item.imageUrl ? [item.imageUrl] : [],
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: Number(item.quantity) || 1,
      };
    });

    // Handle Shipping Cost as separate item
    if (orderData.shippingCost && Number(orderData.shippingCost) > 0) {
      line_items.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Frete - ${orderData.shippingOption?.name || 'Entrega'}`,
          },
          unit_amount: Math.round(Number(orderData.shippingCost) * 100),
        },
        quantity: 1,
      });
    }

    // Handle Discount Coupon
    let stripeCouponId: string | undefined = undefined;
    if (orderData.discountAmount && Number(orderData.discountAmount) > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(Number(orderData.discountAmount) * 100),
        currency: 'brl',
        duration: 'once',
        name: `Desconto - ${orderData.couponCode || 'Cupom'}`,
      });
      stripeCouponId = coupon.id;
    }

    // 4. Create Session
    const success_url = `${req.headers.origin}/checkout/success?orderId=${orderId}&stripeSessionId={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${req.headers.origin}/checkout?canceled=true&orderId=${orderId}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      mode: 'payment',
      client_reference_id: orderId,
      metadata: { orderId },
      success_url,
      cancel_url,
      customer_email: orderData.shippingAddress?.email || undefined,
    });

    // 5. Update Order with stripeSessionId and stripePaymentMethod
    await db.collection('orders').doc(orderId).update({
      stripeSessionId: session.id,
      paymentMethod: 'stripe',
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite Dev Middleware / Static files serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
