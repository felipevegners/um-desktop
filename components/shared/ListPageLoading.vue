<template>
  <section class="flex min-h-[300px] items-center justify-center p-6">
    <LoaderCircle class="animate-spin" :size="42" />
  </section>
</template>

<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';
</script>
