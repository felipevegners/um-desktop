<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

onBeforeMount(() => {
  navigateTo('/rides/list/open');
});
</script>

<template>
  <div />
</template>
