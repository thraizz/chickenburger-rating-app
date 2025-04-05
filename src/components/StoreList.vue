<script setup lang="ts">
import { computed } from 'vue';
import { useStores } from '../composables/useStores';
import type { Store } from '../models/store';

const { stores } = useStores();

const sortedStores = computed(() => {
  return (stores.value || []).sort((a, b) =>
    (a as Store).name.localeCompare((b as Store).name),
  );
});
</script>

<template>
  <div class="grid gap-4 p-4">
    <div
      v-for="store in sortedStores"
      :key="store.id"
      class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
    >
      <h3 class="text-xl font-semibold text-gray-800">
        {{ store.name }}
      </h3>
      <p class="text-gray-600 mt-1">
        {{ store.address }}
      </p>
      <div class="flex justify-between items-center mt-4">
        <RouterLink
          :to="{ name: 'store-detail', params: { id: store.id } }"
          class="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </RouterLink>
      </div>
    </div>
  </div>
</template>
