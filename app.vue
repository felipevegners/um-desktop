<script setup lang="ts">
import Toaster from '@/components/ui/toast/Toaster.vue';

definePageMeta({
  title: 'Urban Mobi - Plataforma de Gestão de Mobilidade Corporativa',
});
// import "@uploadthing/vue/styles.css";
</script>
<template>
  <Toaster />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
