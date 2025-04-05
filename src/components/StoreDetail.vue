<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCurrentUser } from 'vuefire';
import { useStores } from '../composables/useStores';

const props = defineProps<{
  storeId: string;
}>();

const { getStore, getStoreRatings, addRating } = useStores();
const store = getStore(props.storeId);
const ratings = getStoreRatings(props.storeId);
const user = useCurrentUser();

// New rating form
const newRating = ref({
  rating: 5,
  review: '',
});

const averageRating = computed(() => {
  if (!ratings.value?.length)
    return 0;
  const sum = ratings.value.reduce((acc, curr) => acc + curr.rating, 0);
  return (sum / ratings.value.length).toFixed(1);
});

async function submitRating() {
  if (!user.value)
    return;

  await addRating(props.storeId, {
    userId: user.value.uid,
    rating: newRating.value.rating,
    review: newRating.value.review,
  });

  // Reset form
  newRating.value = {
    rating: 5,
    review: '',
  };
}
</script>

<template>
  <div v-if="store" class="p-4 max-w-4xl mx-auto">
    <!-- Store Details -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-900">
        {{ store.name }}
      </h1>
      <p class="text-gray-600 mt-2">
        {{ store.address }}
      </p>
      <div class="mt-4">
        <span class="text-2xl font-semibold">{{ averageRating }}</span>
        <span class="text-gray-500">/5 average rating</span>
      </div>
    </div>

    <!-- Add Rating Form -->
    <div v-if="user" class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">
        Add Your Rating
      </h2>
      <form class="space-y-4" @submit.prevent="submitRating">
        <div>
          <label class="block text-sm font-medium text-gray-700">Rating</label>
          <select
            v-model="newRating.rating"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option v-for="n in 5" :key="n" :value="n">
              {{ n }} stars
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Review</label>
          <textarea
            v-model="newRating.review"
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Write your review here..."
          />
        </div>

        <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit Rating
        </button>
      </form>
    </div>

    <!-- Ratings List -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">
        Ratings & Reviews
      </h2>
      <div v-if="!ratings?.length" class="text-gray-500">
        No ratings yet. Be the first to rate this store!
      </div>
      <div
        v-for="rating in ratings"
        :key="rating.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex items-center justify-between">
          <div class="font-semibold">
            {{ rating.rating }} stars
          </div>
          <div class="text-sm text-gray-500">
            {{ rating.createdAt?.toDate().toLocaleDateString() }}
          </div>
        </div>
        <p class="mt-2 text-gray-700">
          {{ rating.review }}
        </p>
      </div>
    </div>
  </div>
</template>
