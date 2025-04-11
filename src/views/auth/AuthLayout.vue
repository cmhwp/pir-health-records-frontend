<template>
  <div class="auth-layout">
    <div class="auth-container">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
// No setup logic needed for this component
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  background-image: url('@/assets/login_background.svg');
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: 100%;
}

.auth-container {
  width: 100%; 
  max-width: 450px;
}
</style> 