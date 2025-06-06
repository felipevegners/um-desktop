<script setup lang="ts">
import { XCircleIcon } from 'lucide-vue-next';

definePageMeta({
  layout: 'login',
  auth: {
    unauthenticatedOnly: true,
  },
});

const route = useRoute();
</script>
<template>
  <section
    class="w-full h-screen flex flex-col gap-6 items-center justify-center bg-black"
  >
    <div class="p-6 border border-um-primary rounded-md flex flex-col items-center gap-3">
      <XCircleIcon :size="48" class="text-um-primary" />
      <h3 class="font-bold text-xl text-um-primary">
        {{ route.query.error }}
      </h3>
    </div>
    <NuxtLink class="text-xs text-white hover:underline" :href="'/login'">
      Acesse novamente
    </NuxtLink>
  </section>
</template>

<style scoped></style>
