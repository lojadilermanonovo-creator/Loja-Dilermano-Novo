import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from '@/src/integrations/firebase/client';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  addedAt?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isFavorited: (productId: string) => boolean;
  toggleFavorite: (product: { id: string; name: string; price: number; images?: { url: string }[] }) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistItems: [],
  isFavorited: () => false,
  toggleFavorite: async () => {},
  loading: true,
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = `wishlists/${user.uid}/items`;
    
    const unsubscribe = onSnapshot(
      collection(db, 'wishlists', user.uid, 'items'),
      (snapshot) => {
        const itemsList: WishlistItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          itemsList.push({
            productId: docSnap.id,
            name: data.name || '',
            price: Number(data.price) || 0,
            imageUrl: data.imageUrl || '',
            addedAt: data.addedAt || '',
          });
        });
        setWishlistItems(itemsList);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const isFavorited = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const toggleFavorite = async (product: { id: string; name: string; price: number; images?: { url: string }[] }) => {
    if (!user) {
      toast.error('É necessário fazer login para adicionar aos favoritos.');
      
      const currentPath = window.location.pathname + window.location.search;
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }, 1000);
      return;
    }

    const docPath = `wishlists/${user.uid}/items/${product.id}`;
    const itemRef = doc(db, 'wishlists', user.uid, 'items', product.id);

    try {
      if (isFavorited(product.id)) {
        // Remove from wishlist
        await deleteDoc(itemRef);
        toast.success(`${product.name} removido dos favoritos!`);
      } else {
        // Add to wishlist
        const imageUrl = product.images?.[0]?.url || '';
        await setDoc(itemRef, {
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          imageUrl: imageUrl,
          addedAt: new Date().toISOString()
        });
        toast.success(`${product.name} adicionado aos favoritos!`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, isFavorited, toggleFavorite, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
