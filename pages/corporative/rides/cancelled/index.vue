<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

onBeforeMount(() => {
  navigateTo('/rides/list/cancelled');
});
</script>

<template>
  <div />
</template>
