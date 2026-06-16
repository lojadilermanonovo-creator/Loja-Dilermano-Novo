import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/src/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  minOrderValue?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  discountAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'dilermano-cart';
const COUPON_STORAGE_KEY = 'dilermano-coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    const saved = localStorage.getItem(COUPON_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId && i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (productId: string, variantId?: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode) {
      return { success: false, message: 'Por favor, insira um código de cupom.' };
    }

    try {
      const couponRef = doc(db, 'coupons', formattedCode);
      const couponSnap = await getDoc(couponRef);

      if (!couponSnap.exists()) {
        return { success: false, message: 'Cupom inválido ou não encontrado.' };
      }

      const couponData = couponSnap.data() as AppliedCoupon;
      
      if (!couponData.isActive) {
        return { success: false, message: 'Este cupom não está ativo no momento.' };
      }

      if (couponData.maxUses !== undefined && couponData.usedCount !== undefined) {
        if (couponData.usedCount >= couponData.maxUses) {
          return { success: false, message: 'O limite de uso deste cupom foi atingido.' };
        }
      }

      if (couponData.minOrderValue !== undefined && subtotal < couponData.minOrderValue) {
        return { 
          success: false, 
          message: `Este cupom requer um valor mínimo de compra de R$ ${Number(couponData.minOrderValue).toFixed(2)}.` 
        };
      }

      setAppliedCoupon(couponData);
      return { success: true, message: `Cupom "${formattedCode}" aplicado com sucesso!` };
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      return { success: false, message: 'Erro ao validar o cupom. Tente novamente.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Single Source of Truth for discount amount calculation
  let discountAmount = 0;
  if (appliedCoupon && items.length > 0) {
    if (appliedCoupon.type === 'percentage') {
      const rawDiscount = subtotal * (appliedCoupon.value / 100);
      discountAmount = Math.round(rawDiscount * 100) / 100;
    } else {
      discountAmount = appliedCoupon.value;
    }
    // Prevent discount exceeding the subtotal
    discountAmount = Math.min(discountAmount, subtotal);
  }

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      subtotal, 
      totalItems,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      discountAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
