<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

onBeforeMount(() => {
  navigateTo('/rides/form/new');
});
</script>

<template>
  <div />
</template>
