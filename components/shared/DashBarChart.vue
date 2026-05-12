<script setup lang="ts">
import { GroupedBarChart } from '@/components/ui/chart-line';

const props = defineProps<{
  data: Array<{
    name: string;
    date?: Date;
    open: number;
    finished: number;
    cancelled: number;
  }>;
}>();
</script>

<template>
  <GroupedBarChart
    index="date"
    :data="props.data"
    :categories="['open', 'finished', 'cancelled']"
    :show-legend="true"
    class="p-4 h-[360px] bg-white"
    :margin="{ top: 20 }"
    :show-grid-line="true"
    :y-formatter="
      (tick, i) => {
        return typeof tick === 'number' ? `${tick}` : '';
      }
    "
    :category-labels="{
      open: 'Abertos',
      finished: 'Finalizados',
      cancelled: 'Cancelados',
    }"
  />
</template>
