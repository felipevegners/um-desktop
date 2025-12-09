<script setup lang="ts">
import { BarChart } from '@/components/ui/chart-bar';

const props = defineProps<{
  data: any;
}>();
</script>

<template>
  <BarChart
    index="name"
    :data="props.data"
    :categories="['total']"
    :show-legend="false"
    :type="'grouped'"
    class="p-4 h-[360px] bg-white"
    :margin="{ top: 20 }"
    :show-grid-line="false"
    :y-formatter="
      (tick, i) => {
        return typeof tick === 'number' ? `${tick}` : '';
      }
    "
  />
</template>
