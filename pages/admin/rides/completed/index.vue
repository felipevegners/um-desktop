<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

onBeforeMount(() => {
  navigateTo('/rides/list/completed');
});
</script>

<template>
  <div />
</template>
