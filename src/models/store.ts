import type { Timestamp } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { db } from '../firebase';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Store {
  id?: string;
  name: string;
  address: string;
  location: Location;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  convertedFromExisting?: boolean;
}

export interface Rating {
  id?: string;
  storeId: string;
  rating: number;
  review: string;
  createdAt: Timestamp;
}

// Collection references
export const storesCollection = collection(db, 'stores');
export const ratingsCollection = collection(db, 'ratings');

// Helper to get ratings for a specific store
export function getStoreRatingsCollection(storeId: string) {
  return collection(db, 'stores', storeId, 'ratings');
}
