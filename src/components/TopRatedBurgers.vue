<script setup lang="ts">
import { computed } from 'vue';
import { useCollection } from 'vuefire';
import type { Rating, Store } from '../models/store';
import { ratingsCollection, storesCollection } from '../models/store';

interface TopRatedStore extends Store {
  averageRating: number;
  totalRatings: number;
  latestReview?: string;
  latestImageUrl?: string;
}

const stores = useCollection(storesCollection, { wait: true }) as unknown as { value: Store[] };
const ratings = useCollection(ratingsCollection, { wait: true }) as unknown as { value: Rating[] };

const loading = computed(() => !stores.value?.length);

const topStores = computed<TopRatedStore[]>(() => {
  if (!stores.value || !ratings.value)
    return [];

  const storeRatings = new Map<string, Rating[]>();

  // Group ratings by store
  ratings.value.forEach((rating) => {
    if (!storeRatings.has(rating.storeId)) {
      storeRatings.set(rating.storeId, []);
    }
    storeRatings.get(rating.storeId)?.push(rating);
  });

  // Combine store data with their ratings
  const storesWithRatings = stores.value.map((store) => {
    const storeRatingsList = storeRatings.get(store.id!) || [];
    const totalRatings = storeRatingsList.length;
    const averageRating = totalRatings > 0
      ? storeRatingsList.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings
      : 0;

    // Sort ratings by date to get the latest
    const sortedRatings = [...storeRatingsList].sort((a, b) =>
      b.createdAt.toMillis() - a.createdAt.toMillis(),
    );

    return {
      ...store,
      averageRating,
      totalRatings,
      latestReview: sortedRatings[0]?.review,
      latestImageUrl: sortedRatings[0]?.imageUrl,
    } as TopRatedStore;
  });

  // Sort by rating and take top 10
  return storesWithRatings
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);
});
</script>

<template>
  <div class="top-rated-container">
    <h2 class="title">
      Top Rated Chickenburgers
    </h2>
    <div class="subtitle">
      Discover the most loved spots in town
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner" />
      <span>Finding the juiciest burgers...</span>
    </div>

    <div v-else class="cards-container">
      <div
        v-for="(store, index) in topStores"
        :key="store.id"
        class="store-card"
        :style="{ '--delay': `${index * 0.1}s` }"
      >
        <div
          class="card-header"
          :class="{ 'no-image': !store.latestImageUrl }"
          :style="store.latestImageUrl ? { backgroundImage: `url(${store.latestImageUrl})` } : {}"
        >
          <div v-if="!store.latestImageUrl" class="placeholder-content">
            <span class="placeholder-text">No image yet</span>
            <span class="placeholder-icon">🍔</span>
          </div>
          <div class="rating">
            <span class="rating-number">{{ store.averageRating.toFixed(1) }}</span>
            <div class="rating-stars">
              <i
                v-for="n in 5"
                :key="n"
                class="star"
                :class="{ filled: n <= Math.round(store.averageRating) }"
              >★</i>
            </div>
            <span class="rating-count">({{ store.totalRatings }} reviews)</span>
          </div>
        </div>

        <div class="card-content">
          <h3 class="store-name">
            {{ store.name }}
          </h3>
          <p class="store-address">
            {{ store.address }}
          </p>
          <p v-if="store.latestReview" class="latest-review">
            "{{ store.latestReview.length > 100 ? `${store.latestReview.slice(0, 97)}...` : store.latestReview }}"
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-rated-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
  text-align: center;
  margin-bottom: 3rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.store-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  animation: fadeIn 0.5s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

.store-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.card-header {
  height: 200px;
  background: #f7fafc;
  background-size: cover;
  background-position: center;
  position: relative;
}

.card-header.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f6f8fa 0%, #edf2f7 100%);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #a0aec0;
}

.placeholder-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rating {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(4px);
}

.rating-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #cbd5e0;
}

.star.filled {
  color: #f6ad55;
}

.rating-count {
  font-size: 0.875rem;
  color: #718096;
}

.card-content {
  padding: 1.5rem;
}

.store-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.store-address {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 1rem;
}

.latest-review {
  font-size: 0.875rem;
  color: #4a5568;
  font-style: italic;
  line-height: 1.5;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .top-rated-container {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .cards-container {
    grid-template-columns: 1fr;
  }
}
</style>
