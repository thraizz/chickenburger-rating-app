import { addDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCollection, useDocument } from 'vuefire';
import type { Rating, Store } from '../models/store';
import { getStoreRatingsCollection, storesCollection } from '../models/store';

export function useStores() {
  // Get all stores
  const stores = useCollection(storesCollection);

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

  // Add a rating
  const addRating = async (
    storeId: string,
    ratingData: Omit<Rating, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>,
  ) => {
    const timestamp = serverTimestamp();
    const ratingsCollection = getStoreRatingsCollection(storeId);
    return await addDoc(ratingsCollection, {
      ...ratingData,
      storeId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  };

  // Update a rating
  const updateRating = async (
    storeId: string,
    ratingId: string,
    ratingData: Partial<Rating>,
  ) => {
    const ratingRef = doc(getStoreRatingsCollection(storeId), ratingId);
    return await updateDoc(ratingRef, {
      ...ratingData,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    stores,
    getStore,
    addStore,
    updateStore,
    getStoreRatings,
    addRating,
    updateRating,
  };
}
