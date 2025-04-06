<script setup lang="ts">
import Map from '@/components/Map.vue';
import { computed, ref } from 'vue';
import { useCurrentUser } from 'vuefire';

definePage({
  name: 'Home',
  meta: {
    requiresAuth: true,
  },
});

const currentUser = useCurrentUser();
const isAuthenticated = computed(() => !!currentUser.value);
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
  <div class="space-y-8">
    <div v-if="isAuthenticated" class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">
          Discover Chicken Burgers
        </h1>
        <button
          class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200 flex items-center gap-2"
          @click="getUserLocation"
        >
          <i class="fas fa-location-dot" />
          Find Near Me
        </button>
      </div>
      <Map
        v-if="isAuthenticated"
        :key="`map-${currentUser?.uid}`"
        ref="mapRef"
      />
    </div>
    <div v-else class="max-w-2xl mx-auto text-center space-y-6 py-12">
      <img
        src="/chickenburger.png"
        alt="ChickenBurger Logo"
        class="w-32 h-32 mx-auto"
      >
      <h1 class="text-4xl font-bold text-gray-900">
        Welcome to Chickenburger Scout
      </h1>
      <p class="text-xl text-gray-600">
        Discover and rate the best chicken burgers in your area.
      </p>
      <div class="flex justify-center gap-4">
        <router-link
          to="/login"
          class="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-200"
        >
          Log In
        </router-link>
        <router-link
          to="/signup"
          class="px-6 py-3 bg-white text-amber-600 border-2 border-amber-500 rounded-lg hover:bg-amber-50 transition-colors duration-200"
        >
          Sign Up
        </router-link>
      </div>
    </div>
  </div>
</template>
