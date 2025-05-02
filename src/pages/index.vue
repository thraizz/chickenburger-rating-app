<script setup lang="ts">
import Map from '@/components/Map.vue';
import { useIsAuthenticated } from '@/composables/useIsAuthenticated';
import { ref } from 'vue';

definePage({
  name: 'Home',
  meta: {
    requiresAuth: false,
  },
});

const isAuthenticated = useIsAuthenticated();
const mapRef = ref<any | null>(null);
const isMapMounted = ref<boolean>(false);

function getUserLocation() {
  if (!navigator.geolocation || !isMapMounted.value)
    return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      if (isMapMounted.value && mapRef.value?.map) {
        mapRef.value.map.setView([latitude, longitude], 13);
      }
    },
    error => console.error('Error getting location:', error),
    { enableHighAccuracy: true },
  );
}
</script>

<template>
  <div class="space-y-8 w-[80vw]">
    <div class="flex justify-between items-center gap-4">
      <h1 class="text-3xl font-bold text-gray-900">
        Discover Chicken Burgers
      </h1>
      <button
        class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200 flex items-center gap-2"
        @click="getUserLocation"
      >
        Find Near Me
      </button>
    </div>
    <Map
      ref="mapRef"
      :is-authenticated="isAuthenticated"
      @mounted="isMapMounted = true"
    />
  </div>
</template>
