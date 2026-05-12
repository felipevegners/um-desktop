<script setup lang="ts">
import type { BulletLegendItemInterface } from '@unovis/ts';
import { omit } from '@unovis/ts';
import { VisCrosshair, VisTooltip } from '@unovis/vue';
import type { Component } from 'vue';
import { createApp } from 'vue';

import { ChartTooltip } from '.';

const props = withDefaults(
  defineProps<{
    colors: string[];
    index: string;
    items: BulletLegendItemInterface[];
    customTooltip?: Component;
  }>(),
  {
    colors: () => [],
  },
);

// Use weakmap to store reference to each datapoint for Tooltip
const wm = new WeakMap();
function template(d: any) {
  if (wm.has(d)) {
    return wm.get(d);
  } else {
    const componentDiv = document.createElement('div');
    const omittedData = Object.entries(omit(d, [props.index, 'name'])).map(
      ([key, value]) => {
        // `items` may contain objects with `key` (categoria original) or `name` (rótulo).
        const legendReference =
          props.items.find((i) => (i as any).key === key) ||
          props.items.find((i) => i.name === key);
        return {
          name: legendReference?.name ?? key,
          color: legendReference?.color ?? props.colors?.[0] ?? 'transparent',
          value,
        };
      },
    );
    const TooltipComponent = props.customTooltip ?? ChartTooltip;
    const rawIndex = d[props.index];
    const title = d.name
      ? String(d.name)
      : rawIndex instanceof Date
        ? rawIndex.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        : typeof rawIndex === 'number'
          ? new Date(rawIndex).toLocaleDateString('pt-BR', {
              month: 'short',
              year: '2-digit',
            })
          : String(rawIndex);

    createApp(TooltipComponent, {
      title,
      data: omittedData,
    }).mount(componentDiv);
    wm.set(d, componentDiv.innerHTML);
    return componentDiv.innerHTML;
  }
}

function color(d: unknown, i: number) {
  // Prefer the color from the provided legend items (they may contain color info),
  // otherwise fall back to props.colors array.
  const item = props.items?.[i] as any;
  if (item && item.color) return item.color;
  return props.colors?.[i] ?? 'transparent';
}
</script>

<template>
  <VisTooltip :horizontal-shift="20" :vertical-shift="20" />
  <VisCrosshair :template="template" :color="color" />
</template>
