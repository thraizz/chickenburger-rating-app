import { addDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCollection, useCurrentUser, useDocument } from 'vuefire';
import type { Store } from '../models/store';
import { getStoreRatingsCollection, storesCollection } from '../models/store';

export function useStores() {
  // Get all stores
  const stores = useCollection(storesCollection);
  const user = useCurrentUser();

  // Get a single store
  const getStore = (storeId: string) => {
    return useDocument(doc(storesCollection, storeId));
  };

  // Add a new store
  const addStore = async (
    storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const timestamp = serverTimestamp();
    return await addDoc(storesCollection, {
      ...storeData,
      userId: user.value?.uid,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  };

  // Update a store
  const updateStore = async (storeId: string, storeData: Partial<Store>) => {
    const storeRef = doc(storesCollection, storeId);
    return await updateDoc(storeRef, {
      ...storeData,
      updatedAt: serverTimestamp(),
    });
  };

  // Get ratings for a store
  const getStoreRatings = (storeId: string) => {
    return useCollection(getStoreRatingsCollection(storeId));
  };

  return {
    stores,
    getStore,
    addStore,
    updateStore,
    getStoreRatings,
  };
}
