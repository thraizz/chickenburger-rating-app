<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStores } from '../composables/useStores';

const router = useRouter();
const { addStore } = useStores();

const newStore = ref({
  name: '',
  address: '',
  location: {
    latitude: 0,
    longitude: 0,
  },
});

const error = ref('');
const isSubmitting = ref(false);

async function submitStore() {
  if (!newStore.value.name || !newStore.value.address) {
    error.value = 'Please fill in all required fields';
    return;
  }

  try {
    isSubmitting.value = true;
    const storeRef = await addStore({
      name: newStore.value.name,
      address: newStore.value.address,
      location: newStore.value.location,
    });

    // Reset form
    newStore.value = {
      name: '',
      address: '',
      location: {
        latitude: 0,
        longitude: 0,
      },
    };

    // Redirect to the new store's detail page
    router.push({
      name: 'store-detail',
      params: { id: storeRef.id },
    });
  }
  catch (e) {
    error.value = 'Failed to create store. Please try again.';
    console.error(e);
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">
      Add New Store
    </h1>

    <form
      class="bg-white rounded-lg shadow p-6 space-y-4"
      @submit.prevent="submitStore"
    >
      <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-md mb-4">
        {{ error }}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Store Name</label>
        <input
          v-model="newStore.name"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter store name"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Address</label>
        <input
          v-model="newStore.address"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter store address"
        >
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Latitude</label>
          <input
            v-model.number="newStore.location.latitude"
            type="number"
            step="any"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Longitude</label>
          <input
            v-model.number="newStore.location.longitude"
            type="number"
            step="any"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Creating...' : 'Create Store' }}
        </button>
      </div>
    </form>
  </div>
</template>
