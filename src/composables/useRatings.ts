import { db } from '@/firebase';
import { addDoc, collection, doc, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { computed } from 'vue';
import { useCollection, useCurrentUser } from 'vuefire';
import type { Rating } from '../models/store';
import { ratingsCollection } from '../models/store';

export function useRatings(storeId: string) {
  const storeRatingsQuery = query(
    collection(db, 'ratings'),
    where('storeId', '==', storeId),
    orderBy('createdAt', 'desc'),
  );
  const ratings = useCollection<Rating>(storeRatingsQuery);
  const user = useCurrentUser();
  // Add a rating
  const addRating = async (
    storeId: string,
    ratingData: Omit<Rating, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>,
  ) => {
    const timestamp = serverTimestamp();
    return await addDoc(ratingsCollection, {
      ...ratingData,
      storeId,
      userId: user.value?.uid ?? 'was undefined',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  };

  // Update a rating
  const updateRating = async (
    ratingId: string,
    ratingData: Partial<Rating>,
  ) => {
    const ratingRef = doc(ratingsCollection, ratingId);
    return await updateDoc(ratingRef, {
      ...ratingData,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    ratings,
    addRating,
    updateRating,
  };
}

const storeRatingsQuery = query(
  collection(db, 'ratings'),
);
// Get average ratings for all stores
export function useAllRatings() {
  const ratings = useCollection<Rating>(storeRatingsQuery);

  const averageRatings = computed(() => {
    const storeRatings = new Map<string, { total: number; count: number }>();
    ratings.value?.forEach((rating) => {
      if (!storeRatings.has(rating.storeId)) {
        storeRatings.set(rating.storeId, { total: 0, count: 0 });
      }
      const store = storeRatings.get(rating.storeId)!;
      store.total += rating.rating;
      store.count += 1;
    });
    return storeRatings;
  });

  return { averageRatings };
}
