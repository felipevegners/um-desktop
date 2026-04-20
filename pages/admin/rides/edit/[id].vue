<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const route = useRoute();

onBeforeMount(() => {
  navigateTo(`/rides/form/edit/${String(route.params.id || '')}`);
});
</script>

<template>
  <div />
</template>
