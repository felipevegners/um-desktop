<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
</script>

<template>
  <div class="p-6">
    <div class="flex gap-6 items-center"></div>
    <h1 class="text-2xl font-bold">Meu Dashboard UM</h1>
  </div>
  <div class="flex flex-1 flex-col gap-4 p-6 pt-0">
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="aspect-video rounded-xl bg-muted/90" />
      <div class="aspect-video rounded-xl bg-muted/90" />
      <div class="aspect-video rounded-xl bg-muted/90" />
    </div>
    <div class="min-h-[100vh] flex-1 rounded-xl bg-zinc-200 md:min-h-min" />
  </div>
</template>
