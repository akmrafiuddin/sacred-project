<script setup lang="ts">
import { watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";

const { isAuthenticated, isStaff } = useAuth();

watchEffect(() => {
  if (isAuthenticated.value) {
    if (isStaff.value) {
      navigateTo("/admin/dashboard");
    } else {
      navigateTo("/account");
    }
  } else {
    navigateTo("/admin/login");
  }
});
</script>

<template>
  <div class="admin-redirect-loading">
    <div class="spinner"></div>
    <span>Connecting to Super Admin Console...</span>
  </div>
</template>

<style scoped>
.admin-redirect-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(245, 158, 11, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
