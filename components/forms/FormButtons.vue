<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';

const props = defineProps<{
  sbmLabel: string;
  cncLabel: string;
  submit?: string;
  cancel?: string;
  loading?: boolean;
  disabled?: boolean;
}>();

const handleCancel = async () => {
  if (!props.cancel) return;
  await navigateTo(props.cancel);
};
</script>
<template>
  <section
    class="py-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start sm:gap-4"
  >
    <Button
      type="submit"
      class="w-full px-5 py-3 sm:w-auto"
      :disabled="disabled || loading"
    >
      <LoaderCircle v-if="loading" class="h-5 w-5 animate-spin" />
      {{ sbmLabel }}
    </Button>
    <Button
      variant="ghost"
      class="w-full px-5 py-3 sm:w-auto"
      :disabled="loading"
      @click.prevent="handleCancel"
    >
      {{ cncLabel }}
    </Button>
  </section>
</template>

<style scoped></style>
