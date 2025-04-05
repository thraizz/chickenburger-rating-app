<script setup lang="ts">
import type { DocumentData } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useStores } from '../composables/useStores';

interface Store extends DocumentData {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const locations = ref<Store[]>([]);
const isAddingStore = ref(false);
const error = ref<string | null>(null);

let map: L.Map | null = null;
let markersGroup: L.LayerGroup | null = null;
let tempMarker: L.Marker | null = null;

const { stores, addStore } = useStores();

// Custom marker icon
const customIcon = L.icon({
  iconUrl: '/chickenburger_128px.png',
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [1, -34],
});

function toggleAddingStore(): void {
  isAddingStore.value = !isAddingStore.value;
  if (!isAddingStore.value && tempMarker) {
    tempMarker.remove();
    tempMarker = null;
  }
}

async function getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    if (!response.ok)
      throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data.display_name;
  }
  catch (e) {
    console.error('Error getting address:', e);
    return null;
  }
}

async function handleMapClick(e: L.LeafletMouseEvent): Promise<void> {
  if (!isAddingStore.value)
    return;

  const { lat, lng } = e.latlng;
  const address = await getAddressFromCoordinates(lat, lng);

  if (tempMarker) {
    tempMarker.remove();
  }

  tempMarker = L.marker([lat, lng], { icon: customIcon })
    .addTo(map!)
    .bindPopup(
      `<div class="p-4">
        <h3 class="font-bold mb-2">Add New Store</h3>
        <form id="newStoreForm" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Store Name</label>
            <input type="text" id="storeName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" required>
          </div>
          <div class="text-sm text-gray-600 mb-2">
            <strong>Location:</strong><br>
            ${address || 'Address not found'}
          </div>
          <button type="submit" class="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">
            Add Store
          </button>
        </form>
      </div>`,
    )
    .openPopup();

  const form = document.getElementById('newStoreForm');
  if (form) {
    form.addEventListener('submit', async (event: Event) => {
      event.preventDefault();
      const nameInput = document.getElementById('storeName') as HTMLInputElement;

      if (!nameInput?.value.trim()) {
        error.value = 'Store name is required.';
        return;
      }

      try {
        await addStore({
          name: nameInput.value.trim(),
          address: address || 'Address not found',
          location: { latitude: lat, longitude: lng },
        });

        if (tempMarker) {
          tempMarker.remove();
          tempMarker = null;
        }

        isAddingStore.value = false;
        error.value = null;
      }
      catch (e) {
        console.error('Error adding store:', e);
        error.value = 'Failed to add store. Please try again.';
      }
    });
  }
}

onMounted(() => {
  try {
    map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap contributors, © CARTO',
      },
    ).addTo(map);

    markersGroup = L.layerGroup().addTo(map);
    map.on('click', handleMapClick);

    // Watch for changes in stores
    watch(
      stores,
      (newStores) => {
        if (!map || !newStores)
          return;

        locations.value = newStores.map((store: DocumentData) => ({
          id: store.id,
          name: store.name,
          address: store.address,
          location: store.location,
          ...store,
        })) as Store[];

        if (markersGroup) {
          markersGroup.clearLayers();
        }

        locations.value.forEach((store: Store) => {
          if (store.location?.latitude && store.location?.longitude) {
            L.marker(
              [store.location.latitude, store.location.longitude],
              { icon: customIcon },
            )
              .addTo(markersGroup!)
              .bindPopup(`
                <div class="p-2">
                  <h3 class="font-bold">${store.name}</h3>
                  <p class="text-gray-600">${store.address}</p>
                  <button 
                    onclick="window.location.href='/rate/${store.id}'"
                    class="mt-2 px-3 py-1 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600"
                  >
                    View Ratings
                  </button>
                </div>
              `);
          }
        });
      },
      { immediate: true, deep: true },
    );

    // Get user's location
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map?.setView([latitude, longitude], 13);
      },
      (error) => {
        console.error('Error getting location:', error);
      },
    );
  }
  catch (e) {
    console.error('Error in map initialization:', e);
    error.value = 'Failed to initialize map. Please refresh the page.';
  }
});

onUnmounted(() => {
  if (markersGroup) {
    markersGroup.clearLayers();
    markersGroup = null;
  }

  if (tempMarker) {
    tempMarker.remove();
    tempMarker = null;
  }

  if (map) {
    map.off();
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-md">
    <h3 class="text-lg font-semibold text-gray-800 mb-2">
      Chicken Burgers Near You
    </h3>
    <p class="text-sm text-gray-600">
      {{ locations.length }} locations found
    </p>
  </div>
  <div class="relative h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
    <div id="map" class="absolute inset-0" />
    <div class="absolute top-4 right-4 z-[1000] space-y-2">
      <button
        class="w-full bg-white px-4 py-2 rounded-lg shadow-md text-sm font-medium"
        :class="isAddingStore ? 'bg-amber-100 text-amber-700' : 'text-gray-700 hover:bg-gray-50'"
        @click="toggleAddingStore"
      >
        {{ isAddingStore ? 'Cancel Adding Store' : 'Add New Store' }}
      </button>

      <div v-if="error" class="bg-red-50 p-4 rounded-lg shadow-md">
        <p class="text-sm text-red-700">
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.5rem;
}

:deep(.leaflet-popup-content) {
  margin: 0;
  min-width: 200px;
}

:deep(.leaflet-popup-content form input) {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}
</style>
