<script setup lang="ts">
import type { DocumentData } from 'firebase/firestore';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStores } from '../composables/useStores';
import { storesCollection } from '../models/store';

interface Store extends DocumentData {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

// Extended types for Leaflet
declare module 'leaflet' {
  interface LayerOptions {
    zIndex?: number;
  }

  interface MapOptions {
    popupOptions?: {
      className?: string;
      [key: string]: any;
    };
  }
}

const emit = defineEmits<{
  (e: 'mounted'): void;
  (e: 'unmounted'): void;
}>();
const router = useRouter();
const locations = ref<Store[]>([]);
const isAddingStore = ref(false);
const error = ref<string | null>(null);
const isLoadingRestaurants = ref(false);

let map: L.Map | null = null;
let tempMarker: L.Marker | null = null;
let restaurantLayerGroup: L.LayerGroup | null = null;
let storeMarkersGroup: L.LayerGroup | null = null;
let moveEndTimeout: NodeJS.Timeout | null = null;

const { stores } = useStores();

// Custom marker icon
const customIcon = L.icon({
  iconUrl: '/chickenburger_128px.png',
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [1, -34],
});

// Restaurant icon (slightly different color or size to distinguish)
const restaurantIcon = L.icon({
  iconUrl: '/marker-icon-grey.webp',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [1, -34],
});

function toggleAddingStore(): void {
  isAddingStore.value = !isAddingStore.value;
  if (!isAddingStore.value && tempMarker) {
    tempMarker.remove();
    tempMarker = null;
  }
}

async function getAddressFromCoordinates(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.display_name;
  }
  catch (e) {
    console.error('Error getting address:', e);
    return null;
  }
}

function navigateToRatePage(storeId: string): void {
  if (router) {
    router.push(`/rate/${storeId}`);
  }
}

interface OSMElement {
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags: {
    'name'?: string;
    'website'?: string;
    'addr:full'?: string;
    'address'?: string;
  };
}

async function convertToChickenburger(
  lat: number,
  lng: number,
  existingName: string | null,
  existingAddress: string | null,
): Promise<void> {
  if (tempMarker) {
    tempMarker.remove();
  }

  tempMarker = L.marker([lat, lng], { icon: customIcon })
    .addTo(map!)
    .bindPopup(
      `<div class="p-4">
        <h3 class="font-bold mb-2">Convert to Chickenburger Restaurant</h3>
        <form id="newStoreForm" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Store Name</label>
            <input type="text" id="storeName" value="${existingName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm" required>
          </div>
          <div class="text-sm text-gray-600 mb-2">
            <strong>Location:</strong><br>
            ${existingAddress || 'Address not found'}
          </div>
          <button type="submit" class="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">
            Convert Restaurant
          </button>
        </form>
      </div>`,
    )
    .openPopup();

  // Wait for DOM to be ready using nextTick
  await nextTick();

  const form = document.getElementById('newStoreForm');
  if (form) {
    const formSubmitHandler = async (event: Event): Promise<void> => {
      event.preventDefault();
      const nameInput = document.getElementById(
        'storeName',
      ) as HTMLInputElement;

      if (!nameInput || !nameInput.value.trim()) {
        error.value = 'Store name is required.';
        return;
      }

      try {
        await addDoc(storesCollection, {
          name: nameInput.value.trim(),
          address: existingAddress || 'Address not found',
          location: {
            latitude: lat,
            longitude: lng,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          convertedFromExisting: true,
        });

        if (tempMarker) {
          tempMarker.remove();
          tempMarker = null;
        }

        error.value = null;

        // Clean up event listener
        form.removeEventListener('submit', formSubmitHandler);
      }
      catch (e) {
        console.error('Error converting restaurant:', e);
        error.value = 'Failed to convert restaurant. Please try again.';
      }
    };

    // Use addEventListener instead of direct assignment
    form.addEventListener('submit', formSubmitHandler);
  }
}

interface ExtendedHTMLElement extends HTMLElement {
  _clickHandler?: (event: MouseEvent) => void;
}

function debouncedFetchRestaurants(bounds: L.LatLngBounds): void {
  if (moveEndTimeout) {
    clearTimeout(moveEndTimeout);
  }

  moveEndTimeout = setTimeout(() => {
    fetchNearbyRestaurants(bounds);
  }, 300); // 300ms debounce time
}

async function fetchNearbyRestaurants(bounds: L.LatLngBounds): Promise<void> {
  if (!map) {
    return;
  }

  // Only fetch if zoom level is appropriate for showing individual restaurants
  if (map.getZoom() < 16) {
    // Changed from 18 to 16 for better user experience
    if (restaurantLayerGroup) {
      restaurantLayerGroup.clearLayers();
    }
    return;
  }

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      way["amenity"="restaurant"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      relation["amenity"="restaurant"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
    );
    out center;
  `;

  try {
    isLoadingRestaurants.value = true;
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Clear existing restaurant markers
    if (restaurantLayerGroup) {
      restaurantLayerGroup.clearLayers();
    }
    else {
      restaurantLayerGroup = L.layerGroup([], { zIndex: 100 }).addTo(map);
    }

    // Add new restaurant markers
    data.elements.forEach((element: OSMElement) => {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (lat && lon) {
        const marker = L.marker([lat, lon], { icon: restaurantIcon }).addTo(
          restaurantLayerGroup!,
        ).bindPopup(`
            <div class="p-4">
              <div class="mb-4">
                <h3 class="font-bold text-lg text-gray-900">${
                  element.tags.name || 'Unnamed Restaurant'
                }</h3>
              </div>
              
              <div class="space-y-2">
                ${
                  element.tags.website
                    ? `<a href="${element.tags.website}" 
                    target="_blank" 
                    class="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Visit Website
                  </a>`
                    : ''
                }
                
                <button 
                  id="convertBtn-${lat}-${lon}"
                  class="w-full mt-3 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  They have chicken burgers!
                </button>
              </div>
            </div>
          `);

        // Use unique IDs for buttons in popups
        marker.on('popupopen', () => {
          const convertBtn = document.getElementById(
            `convertBtn-${lat}-${lon}`,
          ) as ExtendedHTMLElement;
          if (convertBtn) {
            // Create handler function that we can remove later
            const clickHandler = () => {
              convertToChickenburger(
                lat,
                lon,
                element.tags.name || 'Unnamed Restaurant',
                element.tags['addr:full'] || element.tags.address || null,
              );
            };

            // Remove any existing click handlers to avoid duplicates
            convertBtn.removeEventListener('click', clickHandler);
            convertBtn.addEventListener('click', clickHandler);

            // Store the handler reference for cleanup
            convertBtn._clickHandler = clickHandler;
          }
        });

        // Clean up event listeners when popup closes
        marker.on('popupclose', () => {
          const convertBtn = document.getElementById(
            `convertBtn-${lat}-${lon}`,
          ) as ExtendedHTMLElement;
          if (convertBtn && convertBtn._clickHandler) {
            convertBtn.removeEventListener('click', convertBtn._clickHandler);
            delete convertBtn._clickHandler;
          }
        });
      }
    });
  }
  catch (e) {
    console.error('Error fetching restaurants:', e);
    error.value = 'Failed to load nearby restaurants. Please try again later.';
  }
  finally {
    isLoadingRestaurants.value = false;
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

  // Wait for DOM to be ready
  await nextTick();

  const form = document.getElementById('newStoreForm');
  if (form) {
    const formSubmitHandler = async (event: Event): Promise<void> => {
      event.preventDefault();
      const nameInput = document.getElementById(
        'storeName',
      ) as HTMLInputElement;

      if (!nameInput || !nameInput.value.trim()) {
        error.value = 'Store name is required.';
        return;
      }

      try {
        const docRef = await addDoc(storesCollection, {
          name: nameInput.value.trim(),
          address: address || 'Address not found',
          location: {
            latitude: lat,
            longitude: lng,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Add marker immediately after successful store creation
        const newMarker = L.marker([lat, lng], { icon: customIcon }).addTo(
          storeMarkersGroup || map!,
        ).bindPopup(`
            <div class="p-2">
              <h3 class="font-bold">${nameInput.value.trim()}</h3>
              <p class="text-gray-600">${address || 'Address not found'}</p>
              <button 
                id="viewRatingsBtn-${docRef.id}"
                class="mt-2 px-3 py-1 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600 inline-block"
              >
                View Ratings
              </button>
            </div>
          `);

        newMarker.on('popupopen', () => {
          const viewBtn = document.getElementById(
            `viewRatingsBtn-${docRef.id}`,
          ) as ExtendedHTMLElement;
          if (viewBtn) {
            const clickHandler = () => navigateToRatePage(docRef.id);
            viewBtn.addEventListener('click', clickHandler);
            viewBtn._clickHandler = clickHandler;
          }
        });

        newMarker.on('popupclose', () => {
          const viewBtn = document.getElementById(
            `viewRatingsBtn-${docRef.id}`,
          ) as ExtendedHTMLElement;
          if (viewBtn && viewBtn._clickHandler) {
            viewBtn.removeEventListener('click', viewBtn._clickHandler);
            delete viewBtn._clickHandler;
          }
        });

        if (tempMarker) {
          tempMarker.remove();
          tempMarker = null;
        }

        isAddingStore.value = false;
        error.value = null;

        // Clean up the event listener
        form.removeEventListener('submit', formSubmitHandler);
      }
      catch (e) {
        console.error('Error adding store:', e);
        error.value = 'Failed to add store. Please try again.';
      }
    };

    // Use addEventListener to set up the event handler
    form.addEventListener('submit', formSubmitHandler);
  }
}

onMounted(async () => {
  try {
    // Initialize map centered on a default location
    map = L.map('map', {
      zoomControl: false, // We'll add it back in a specific position
    }).setView([51.505, -0.09], 13);

    // Add CartoDB's Voyager tiles (cleaner style without POIs)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap contributors, © CARTO',
        zIndex: 1,
      },
    ).addTo(map);

    // Add zoom control to the top-right
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    // Initialize layer groups with explicit z-index values
    restaurantLayerGroup = L.layerGroup([], { zIndex: 100 }).addTo(map);
    storeMarkersGroup = L.layerGroup([], { zIndex: 200 }).addTo(map);

    // Set higher z-index for popups globally
    map.options.popupOptions = {
      ...map.options.popupOptions,
      className: 'custom-popup',
    };

    // Add click handler for adding new stores
    map.on('click', handleMapClick);

    // Add handlers to fetch restaurants when map moves or zooms - with debouncing
    map.on('moveend', () => {
      if (map)
        debouncedFetchRestaurants(map.getBounds());
    });

    map.on('zoomend', () => {
      if (map)
        debouncedFetchRestaurants(map.getBounds());
    });

    // Set initial locations from stores
    locations.value = (stores.value || []).map((store: DocumentData) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      location: store.location,
      ...store,
    })) as Store[];

    // Watch for changes in stores
    watch(
      stores,
      (newStores) => {
        if (!map || !newStores)
          return;

        // Update locations count for UI
        locations.value = newStores.map((store: DocumentData) => ({
          id: store.id,
          name: store.name,
          address: store.address,
          location: store.location,
          ...store,
        })) as Store[];

        // Clear existing store markers
        if (storeMarkersGroup) {
          storeMarkersGroup.clearLayers();
        }
        else {
          storeMarkersGroup = L.layerGroup([], { zIndex: 200 }).addTo(map);
        }

        // Add markers for each store
        locations.value.forEach((store: Store) => {
          if (
            store.location
            && store.location.latitude
            && store.location.longitude
            && map
          ) {
            const marker = L.marker(
              [store.location.latitude, store.location.longitude],
              { icon: customIcon },
            ).addTo(storeMarkersGroup!).bindPopup(`
              <div class="p-2">
                <h3 class="font-bold">${store.name}</h3>
                <p class="text-gray-600">${store.address}</p>
                <button 
                  id="viewRatingsBtn-${store.id}"
                  class="mt-2 px-3 py-1 bg-amber-500 text-white rounded-md text-sm hover:bg-amber-600 inline-block"
                >
                  View Ratings
                </button>
              </div>
            `);

            // Add event listeners for the view ratings button
            marker.on('popupopen', () => {
              const viewBtn = document.getElementById(
                `viewRatingsBtn-${store.id}`,
              ) as ExtendedHTMLElement;
              if (viewBtn) {
                const clickHandler = () => navigateToRatePage(store.id);
                viewBtn.addEventListener('click', clickHandler);
                viewBtn._clickHandler = clickHandler;
              }
            });

            marker.on('popupclose', () => {
              const viewBtn = document.getElementById(
                `viewRatingsBtn-${store.id}`,
              ) as ExtendedHTMLElement;
              if (viewBtn && viewBtn._clickHandler) {
                viewBtn.removeEventListener('click', viewBtn._clickHandler);
                delete viewBtn._clickHandler;
              }
            });
          }
        });
      },
      { immediate: true },
    );

    // Get user's location if permitted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map) {
            map.setView([latitude, longitude], 13);
            // Fetch restaurants in the area after setting location
            debouncedFetchRestaurants(map.getBounds());
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fetch restaurants in the default view area
          if (map)
            debouncedFetchRestaurants(map.getBounds());
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
      );
    }
    else {
      // If geolocation is not available, fetch restaurants in the default view area
      if (map)
        debouncedFetchRestaurants(map.getBounds());
    }

    emit('mounted'); // Emit mounted event after map is initialized
  }
  catch (e) {
    console.error('Error in map initialization:', e);
    error.value = 'Failed to initialize map. Please refresh the page.';
  }
});

onUnmounted(() => {
  emit('unmounted'); // Emit unmounted event before cleanup

  // Clear any pending timeouts
  if (moveEndTimeout) {
    clearTimeout(moveEndTimeout);
    moveEndTimeout = null;
  }

  if (map) {
    // Remove all layers
    if (restaurantLayerGroup) {
      restaurantLayerGroup.clearLayers();
      map.removeLayer(restaurantLayerGroup);
      restaurantLayerGroup = null;
    }

    if (storeMarkersGroup) {
      storeMarkersGroup.clearLayers();
      map.removeLayer(storeMarkersGroup);
      storeMarkersGroup = null;
    }

    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }

    // Remove all event listeners
    map.off();
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="relative h-[600px] w-full rounded-lg overflow-hidden shadow-lg">
    <div id="map" class="absolute inset-0" />
    <div class="absolute top-4 right-4 z-[2000] space-y-2">
      <div class="bg-white p-4 rounded-lg shadow-md">
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          Chicken Burgers Near You
        </h3>
        <p class="text-sm text-gray-600">
          {{ locations.length }} locations found
        </p>
      </div>

      <button
        class="w-full bg-white px-4 py-2 rounded-lg shadow-md text-sm font-medium"
        :class="
          isAddingStore
            ? 'bg-amber-100 text-amber-700'
            : 'text-gray-700 hover:bg-gray-50'
        "
        @click="toggleAddingStore"
      >
        {{ isAddingStore ? 'Cancel Adding Store' : 'Add New Store' }}
      </button>

      <div v-if="isAddingStore" class="bg-amber-50 p-4 rounded-lg shadow-md">
        <p class="text-sm text-amber-700">
          Click anywhere on the map to add a new store
        </p>
      </div>

      <div
        v-if="isLoadingRestaurants"
        class="bg-blue-50 p-4 rounded-lg shadow-md"
      >
        <p class="text-sm text-blue-700">
          Loading nearby restaurants...
        </p>
      </div>

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
  z-index: 2500 !important;
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

:deep(.custom-popup) {
  z-index: 2500;
}

:deep(.leaflet-control-zoom) {
  margin-right: 180px !important;
  margin-top: 10px !important;
}
</style>
