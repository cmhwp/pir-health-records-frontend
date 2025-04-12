<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const initialized = ref(false);

onMounted(async () => {
  await userStore.restoreSession();
  initialized.value = true;
});
</script>

<template>
  <router-view v-if="initialized" />
  <div v-else class="loading-container">
    <a-spin tip="加载中..." size="large" />
  </div>
</template>

<style>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}
</style>
