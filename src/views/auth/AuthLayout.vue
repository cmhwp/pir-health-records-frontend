<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-logo">
        <h1>PIR健康记录系统</h1>
      </div>
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AuthLayout'
});
</script>

<style scoped>
.auth-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 24px;
}

.auth-logo h1 {
  color: #1890ff;
}
</style> 