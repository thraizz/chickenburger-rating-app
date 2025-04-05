<script setup lang="ts">
import { db } from '@/firebase';
import type { Rating, Store } from '@/models/store';
import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCollection, useDocument } from 'vuefire';

const route = useRoute();
const id = route.params.id as string;

// Use VueFire's composables
const {
  data: store,
  pending,
  error,
} = useDocument<Store>(doc(db, 'stores', id));

const storeRatingsQuery = query(
  collection(db, 'ratings'),
  where('storeId', '==', id),
  orderBy('createdAt', 'desc'),
);
const { data: storeRatings } = useCollection<Rating>(storeRatingsQuery);

const rating = ref(0);
const hoverRating = ref(0);
const review = ref('');
const submitting = ref(false);

// Submit rating
async function submitRating() {
  if (!rating.value)
    return;

  submitting.value = true;
  try {
    await addDoc(collection(db, 'ratings'), {
      storeId: id,
      rating: rating.value,
      review: review.value.trim(),
      createdAt: serverTimestamp(),
    });

    // Reset form
    rating.value = 0;
    review.value = '';
  }
  catch (e) {
    console.error('Error submitting rating:', e);
  }
  finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <div v-if="pending" class="text-center py-8">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"
      />
      <p class="mt-4 text-gray-600">
        Loading store details...
      </p>
    </div>

    <div v-else-if="error" class="bg-red-50 p-4 rounded-lg text-red-700">
      {{ error }}
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ store?.name }}
      </h1>
      <p class="text-gray-600 mb-6">
        {{ store?.address }}
      </p>

      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">
          Rate this Chicken Burger
        </h2>

        <!-- Star Rating -->
        <div class="flex items-center mb-6">
          <div class="flex space-x-1">
            <button
              v-for="star in 5"
              :key="star"
              class="focus:outline-none"
              :class="
                star <= (hoverRating || rating)
                  ? 'text-amber-400'
                  : 'text-gray-300'
              "
              @click="rating = star"
              @mouseenter="hoverRating = star"
              @mouseleave="hoverRating = 0"
            >
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            </button>
          </div>
          <span class="ml-2 text-gray-600">
            {{
              rating
                ? `${rating} star${rating !== 1 ? 's' : ''}`
                : 'Select rating'
            }}
          </span>
        </div>

        <!-- Review Text -->
        <div class="mb-6">
          <label
            for="review"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Review
          </label>
          <textarea
            id="review"
            v-model="review"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
            placeholder="Tell us about your chicken burger experience..."
          />
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end">
          <button
            :disabled="!rating || submitting"
            class="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="submitRating"
          >
            {{ submitting ? 'Submitting...' : 'Submit Rating' }}
          </button>
        </div>
      </div>

      <!-- Previous Ratings -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold mb-4">
          Previous Ratings
        </h3>
        <div v-if="!storeRatings?.length" class="text-gray-600">
          No ratings yet. Be the first to rate!
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="r in storeRatings"
            :key="r.id"
            class="bg-white rounded-lg shadow p-4"
          >
            <div class="flex items-center mb-2">
              <div class="flex text-amber-400">
                <svg
                  v-for="star in r.rating"
                  :key="star"
                  class="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </div>
              <span class="ml-2 text-sm text-gray-600">
                {{ new Date(r.createdAt?.toDate()).toLocaleDateString() }}
              </span>
            </div>
            <p class="text-gray-700">
              {{ r.review }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
