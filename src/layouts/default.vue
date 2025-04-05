<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCurrentUser, useFirebaseAuth } from 'vuefire';

const navigationItems = [
  { name: 'Home', path: '/' },
  { name: 'Top Rated', path: '/top-rated' },
  { name: 'About', path: '/about' },
];

const currentUser = useCurrentUser();
const auth = useFirebaseAuth();
const router = useRouter();
const isUserMenuOpen = ref(false);

async function handleLogout() {
  try {
    await auth?.signOut();
    router.push('/login');
  }
  catch (error) {
    console.error('Logout failed:', error);
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center">
              <img src="/chickenburger.png" alt="Logo" class="h-8 w-8 mr-2">
              <span
                class="hidden md:block text-2xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent"
              >
                Chickenburger Scout
              </span>
            </router-link>
          </div>
          <div class="flex items-center space-x-4">
            <div
              v-if="currentUser"
            >
              <router-link
                v-for="item in navigationItems"
                :key="item.path"
                :to="item.path"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-colors duration-200"
              >
                {{ item.name }}
              </router-link>
            </div>

            <!-- User Menu -->
            <div v-if="currentUser" class="relative ml-3">
              <button
                type="button"
                class="flex items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                @click="isUserMenuOpen = !isUserMenuOpen"
              >
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                  {{ currentUser.email?.[0].toUpperCase() }}
                </div>
              </button>

              <!-- Dropdown menu -->
              <div
                v-if="isUserMenuOpen"
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <router-link
                  to="/settings"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                  @click="isUserMenuOpen = false"
                >
                  Settings
                </router-link>
                <button
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                  @click="handleLogout"
                >
                  Sign out
                </button>
              </div>
            </div>

            <!-- Login/Register buttons for non-authenticated users -->
            <template v-else>
              <router-link
                to="/login"
                class="px-3 py-2 rounded-md text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors duration-200"
              >
                Log in
              </router-link>
              <router-link
                to="/register"
                class="px-3 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors duration-200"
              >
                Sign up
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- <router-view v-slot="{ Component }">
        <transition
          name="page"
          mode="out-in"
          enter-active-class="transform transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transform transition-all duration-300 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
        >
          <div :key="$route.fullPath">
            <component :is="Component" />
          </div>
        </transition>
      </router-view> -->
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-white mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <p class="text-gray-500 text-sm">
            © {{ new Date().getFullYear() }} Chickenburger Scout. All rights
            reserved.
          </p>
          <div class="flex space-x-6">
            <a
              href="#"
              class="text-gray-400 hover:text-amber-600 transition-colors duration-200"
            >
              <span class="sr-only">Twitter</span>
              <i class="fab fa-twitter text-xl" />
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-amber-600 transition-colors duration-200"
            >
              <span class="sr-only">Instagram</span>
              <i class="fab fa-instagram text-xl" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
