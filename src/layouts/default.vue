<script setup>
const navigationItems = [
  { name: 'Home', path: '/' },
  { name: 'Top Rated', path: '/top-rated' },
  { name: 'About', path: '/about' },
];
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
                class="text-2xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent"
              >
                ChickenBurger
              </span>
            </router-link>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              v-for="item in navigationItems"
              :key="item.path"
              :to="item.path"
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition-colors duration-200"
            >
              {{ item.name }}
            </router-link>
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
            © {{ new Date().getFullYear() }} ChickenBurger Ratings. All rights
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
