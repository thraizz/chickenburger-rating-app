<script setup lang="ts">
import { useRatings } from '@/composables/useRatings';
import { db } from '@/firebase';
import type { Store } from '@/models/store';
import {
  doc,
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDocument } from 'vuefire';

// Define page with authentication requirement
definePage({
  name: 'RateStore',
  meta: {
    requiresAuth: true,
  },
});

const route = useRoute();
const id = route.params.id as string;
const storage = getStorage();

// Use VueFire's composables
const {
  data: store,
  pending,
  error,
} = useDocument<Store>(doc(db, 'stores', id));

const { addRating, ratings } = useRatings(id);

const rating = ref(0);
const hoverRating = ref(0);
const review = ref('');
const submitting = ref(false);
const selectedImage = ref<File | null>(null);
const imagePreview = ref('');
const uploadError = ref('');

// Handle image selection
function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      uploadError.value = 'Image size must be less than 5MB';
      selectedImage.value = null;
      imagePreview.value = '';
      return;
    }
    // Check file type
    if (!file.type.startsWith('image/')) {
      uploadError.value = 'Only image files are allowed';
      selectedImage.value = null;
      imagePreview.value = '';
      return;
    }
    uploadError.value = '';
    selectedImage.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

// Submit rating
async function submitRating() {
  if (!rating.value)
    return;

  submitting.value = true;
  uploadError.value = '';

  try {
    let imageUrl = '';

    // Upload image if selected
    if (selectedImage.value) {
      try {
        const imageRef = storageRef(storage, `ratings/${id}/${Date.now()}-${selectedImage.value.name}`);
        const snapshot = await uploadBytes(imageRef, selectedImage.value);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      catch (e) {
        console.error('Error uploading image:', e);
        uploadError.value = 'Failed to upload image. Please try again or submit without an image.';
        submitting.value = false;
        return;
      }
    }

    await addRating(id, {
      rating: rating.value,
      review: review.value,
      imageUrl,
    });

    // Reset form
    rating.value = 0;
    review.value = '';
    selectedImage.value = null;
    imagePreview.value = '';
    uploadError.value = '';
  }
  catch (e) {
    console.error('Error submitting rating:', e);
    uploadError.value = 'Failed to submit rating. Please try again.';
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

        <!-- Rating Selection -->
        <div class="flex flex-col md:flex-row items-center mb-6">
          <div class="relative flex space-x-1">
            <!-- Burger icons -->
            <div class="flex space-x-1">
              <div
                v-for="burger in 10"
                :key="burger"
                class="transition-opacity duration-150"
                :class="burger <= (hoverRating || rating) ? 'opacity-100' : 'opacity-30'"
              >
                <img src="/chickenburger_128px.png" class="w-8 h-8" alt="Chicken Burger Rating">
              </div>
            </div>

            <!-- Interactive area -->
            <div
              class="absolute top-0 left-0 w-full h-full"
              @mousemove="(e: MouseEvent) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const width = rect.width;
                const burgerWidth = width / 10;
                hoverRating = Math.max(1, Math.min(10, Math.ceil(x / burgerWidth)));
              }"
              @mouseleave="hoverRating = 0"
              @click="rating = hoverRating"
            />
          </div>
          <span class="ml-2 text-gray-600">
            {{
              rating
                ? `${rating} out of 10 burger${rating !== 1 ? 's' : ''}`
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

        <!-- Image Upload -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Add a Photo (optional, max 5MB)
          </label>
          <div class="flex items-center space-x-4">
            <label
              class="cursor-pointer px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span class="text-sm text-gray-600">Choose Image</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageSelect"
              >
            </label>
            <div v-if="imagePreview" class="relative">
              <img
                :src="imagePreview"
                class="h-20 w-20 object-cover rounded-md"
                alt="Selected image preview"
              >
              <button
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                @click="selectedImage = null; imagePreview = ''; uploadError = ''"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p v-if="uploadError" class="mt-2 text-sm text-red-600">
            {{ uploadError }}
          </p>
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
        <div v-if="!ratings?.length" class="text-gray-600">
          No ratings yet. Be the first to rate!
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="r in ratings"
            :key="r.id"
            class="bg-white rounded-lg shadow p-4"
          >
            <div class="flex items-center mb-2">
              <div class="flex space-x-1">
                <div
                  v-for="burger in 10"
                  :key="burger"
                  :class="burger <= r.rating ? 'opacity-100' : 'opacity-30'"
                  class="transition-opacity duration-150"
                >
                  <img src="/chickenburger_128px.png" class="w-5 h-5" alt="Chicken Burger Rating">
                </div>
              </div>
              <span class="ml-2 text-sm text-gray-600">
                {{ new Date(r.createdAt?.toDate()).toLocaleDateString() }}
              </span>
            </div>
            <p class="text-gray-700 mb-4">
              {{ r.review }}
            </p>
            <img
              v-if="r.imageUrl"
              :src="r.imageUrl"
              class="w-full max-w-md rounded-lg shadow-sm"
              alt="Rating photo"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
