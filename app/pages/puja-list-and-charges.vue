<script setup lang="ts">
// Clean redirect to single unified Puja & Rituals page
await navigateTo("/puja-and-rituals", { redirectCode: 301, replace: true });
</script>

<template>
  <div class="redirect-container" style="padding: 6rem 2rem; text-align: center;">
    <p>Redirecting to <NuxtLink to="/puja-and-rituals">Puja &amp; Rituals</NuxtLink>...</p>
  </div>
</template>
