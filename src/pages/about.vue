<script setup lang="ts">
// Component logic can be added here
</script>

<template>
  <div class="about-container">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="title">
          About Chickenburger Scout
        </h1>
        <p class="subtitle">
          Discover the ultimate guide to rating your favorite chicken burgers
        </p>
      </div>
      <div class="hero-pattern" />
    </section>

    <!-- Mission Section -->
    <section class="mission">
      <div class="content-wrapper">
        <h2>Our Mission</h2>
        <p>We're passionate about helping food enthusiasts discover and rate the best chicken burgers around the world. Our platform brings together a community of burger lovers who share their experiences and help others find their next favorite meal.</p>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features">
      <div class="features-grid">
        <div class="feature-card">
          <div class="icon">
            🍔
          </div>
          <h3>Rate & Review</h3>
          <p>Share your experiences and help others discover great burgers</p>
        </div>
        <div class="feature-card">
          <div class="icon">
            📍
          </div>
          <h3>Find Nearby</h3>
          <p>Discover the best-rated chicken burgers in your area</p>
        </div>
        <div class="feature-card">
          <div class="icon">
            📸
          </div>
          <h3>Photo Gallery</h3>
          <p>Browse mouth-watering photos from our community</p>
        </div>
        <div class="feature-card">
          <div class="icon">
            👥
          </div>
          <h3>Community</h3>
          <p>Connect with fellow burger enthusiasts</p>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team">
      <div class="content-wrapper">
        <h2>Meet Our Team</h2>
        <div class="team-grid">
          <div class="team-member">
            <div class="member-avatar" />
            <h3>Aron</h3>
            <p>Main Dev & Creator</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-container {
  min-height: 100vh;
  background: #ffffff;
}

.hero {
  position: relative;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffe66d 100%);
  overflow: hidden;
}

.hero-content {
  text-align: center;
  color: white;
  z-index: 2;
  padding: 2rem;
}

.title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeIn 1s ease-out;
}

.subtitle {
  font-size: 1.5rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  animation: slideUp 1s ease-out 0.5s both;
}

.hero-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.mission {
  background: #f8f9fa;
  text-align: center;
}

.mission h2 {
  font-size: 2.5rem;
  color: #2d3436;
  margin-bottom: 2rem;
}

.mission p {
  font-size: 1.2rem;
  color: #636e72;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
}

.features {
  padding: 4rem 2rem;
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  transition: transform 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #2d3436;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #636e72;
}

.team {
  background: #f8f9fa;
  text-align: center;
}

.team h2 {
  font-size: 2.5rem;
  color: #2d3436;
  margin-bottom: 3rem;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 3rem;
  max-width: 800px;
  margin: 0 auto;
}

.team-member {
  text-align: center;
}

.member-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  background: #dfe6e9;
  position: relative;
  overflow: hidden;
}

.member-avatar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(0, 0, 0, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.team-member h3 {
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.team-member p {
  color: #636e72;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
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
  .title {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1.2rem;
  }

  .content-wrapper {
    padding: 3rem 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
