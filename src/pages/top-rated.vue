<script setup lang="ts">
import TopRatedBurgers from '../components/TopRatedBurgers.vue';
</script>

<template>
  <div class="top-rated-page">
    <TopRatedBurgers />
  </div>
</template>

<style scoped>
.top-rated-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f6f8fa 0%, #f1f5f9 100%);
  padding: 2rem 1rem;
}
</style>
