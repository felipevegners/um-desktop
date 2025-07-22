<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';

defineProps<{
  sbmLabel: string;
  cncLabel: string;
  submit?: string;
  cancel?: string;
  loading?: boolean;
  disabled?: boolean;
}>();
</script>
<template>
  <section class="py-8 space-x-6">
    <Button type="submit" class="p-6" :disabled="disabled">
      <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
      {{ sbmLabel }}
    </Button>
    <Button variant="ghost" class="p-6" @click.prevent="navigateTo(cancel)">
      {{ cncLabel }}
    </Button>
  </section>
</template>

<style scoped></style>
