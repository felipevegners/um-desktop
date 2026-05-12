<script setup lang="ts" generic="T extends Record<string, any>">
import { ChartCrosshair, ChartLegend } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import type { BulletLegendItemInterface } from '@unovis/ts';
import { Axis } from '@unovis/ts';
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue';
import { useMounted } from '@vueuse/core';
import type { Component } from 'vue';
import { computed } from 'vue';

import type { BaseChartProps } from '../chart';

const props = withDefaults(
  defineProps<
    BaseChartProps<T> & {
      customTooltip?: Component;
      roundedCorners?: number;
      showLegend?: boolean;
      showTooltip?: boolean;
      showXAxis?: boolean;
      showYAxis?: boolean;
      showGridLine?: boolean;
      filterOpacity?: number;
      margin?: any;
      categoryLabels?: Record<string, string>;
    }
  >(),
  {
    roundedCorners: 0,
    showLegend: true,
    showTooltip: true,
    showXAxis: true,
    showYAxis: true,
    showGridLine: true,
    filterOpacity: 0.2,
    margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    categoryLabels: undefined,
  },
);
const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number];
}>();

type KeyOfT = Extract<keyof T, string>;
type Data = (typeof props.data)[number];

const index = computed(() => props.index as KeyOfT);
// Cores dos status conforme RideStatusFlag
const statusColors: Record<string, string> = {
  open: 'rgb(37, 99, 235)', // blue-600 (created/pending/accepted)
  finished: 'rgb(24, 24, 27)', // zinc-900 (completed)
  cancelled: 'rgb(220, 38, 38)', // red-600 (cancelled)
};

const colors = computed(() => {
  if (props.colors?.length) return props.colors;
  return props.categories.map((cat) => {
    if (cat === 'open' || cat === 'created' || cat === 'pending' || cat === 'accepted')
      return statusColors.open;
    if (cat === 'finished' || cat === 'completed') return statusColors.finished;
    if (
      cat === 'cancelled' ||
      cat === 'canceled' ||
      cat === 'refused' ||
      cat === 'rejected' ||
      cat === 'over_quota'
    )
      return statusColors.cancelled;
    return 'rgb(251, 191, 36)';
  });
});
const legendItems = computed(() =>
  props.categories.map((category, i) => ({
    key: category,
    name: props.categoryLabels?.[category] ?? category,
    color: colors.value[i],
    inactive: false,
  })),
);

const isMounted = useMounted();

// Calcular máximo do eixo Y para gerar ticks inteiros (0..max)
const yMax = computed(() => {
  const vals: number[] = [];
  (props.data || []).forEach((row: any) => {
    props.categories.forEach((c: string) => {
      const v = Number(row[c]);
      if (!Number.isNaN(v)) vals.push(Math.floor(v));
    });
  });
  const max = vals.length ? Math.max(...vals) : 0;
  return Math.max(1, max);
});

const yTickValues = computed(() => {
  const max = yMax.value;
  return Array.from({ length: max + 1 }, (_, i) => i);
});

const xTickValues = computed(() => {
  const idx = index.value as string;
  if (!props.data) return [];
  return (props.data as any[]).map((row) => row[idx]);
});

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits('legendItemClick', d, i);
}
</script>

<template>
  <div :class="cn('w-full h-[400px] flex flex-col items-end', $attrs.class ?? '')">
    <ChartLegend
      v-if="showLegend"
      :items="legendItems"
      @legend-item-click="handleLegendItemClick"
    />
    <VisXYContainer
      :data="data"
      :style="{ height: isMounted ? '100%' : 'auto' }"
      :margin="margin"
    >
      <ChartCrosshair
        v-if="showTooltip"
        :colors="colors"
        :items="legendItems"
        :custom-tooltip="customTooltip"
        :index="index"
      />
      <VisGroupedBar
        :x="(d: Data) => d[index]"
        :y="categories.map((category) => (d: Data) => d[category])"
        :color="colors"
        :rounded-corners="6"
        :bar-width="0.6"
      />
      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-values="xTickValues"
        :tick-format="
          xFormatter ??
          ((v) => {
            if (v instanceof Date)
              return v.toLocaleDateString('pt-BR', {
                month: 'short',
                year: '2-digit',
                timeZone: 'UTC',
              });
            if (typeof v === 'number')
              return new Date(v).toLocaleDateString('pt-BR', {
                month: 'short',
                year: '2-digit',
                timeZone: 'UTC',
              });
            return String(v);
          })
        "
        :grid-line="false"
        :tick-line="false"
        tick-text-color="hsl(var(--vis-text-color))"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-line="false"
        :tick-format="yFormatter ?? ((v: any) => String(Math.round(Number(v))))"
        :tick-values="yTickValues"
        :domain-line="false"
        :grid-line="showGridLine"
        :attributes="{ [Axis.selectors.grid]: { class: 'text-muted' } }"
        tick-text-color="hsl(var(--vis-text-color))"
      />
      <slot />
    </VisXYContainer>
  </div>
</template>

<style scoped>
/* Forçar os pontos a permanecerem visíveis (override de estilos internos do Unovis) */
::v-deep .vis__point,
::v-deep circle.vis__point,
::v-deep .vis-point {
  opacity: 1 !important;
  display: inline !important;
}
</style>
