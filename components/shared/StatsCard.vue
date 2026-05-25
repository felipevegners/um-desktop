<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next';

type StatsCardVariant = 'default' | 'warning' | 'success' | 'danger' | 'info';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    subValue?: string;
    variant?: StatsCardVariant;
    loading?: boolean;
  }>(),
  {
    variant: 'default',
    loading: false,
  },
);

const variantClasses: Record<
  StatsCardVariant,
  { card: string; label: string; value: string; sub: string }
> = {
  default: {
    card: 'border-zinc-200 bg-white',
    label: 'text-zinc-500',
    value: 'text-zinc-950',
    sub: 'text-zinc-600',
  },
  warning: {
    card: 'border-amber-200 bg-amber-50',
    label: 'text-amber-700',
    value: 'text-amber-900',
    sub: 'text-amber-700',
  },
  success: {
    card: 'border-emerald-200 bg-emerald-50',
    label: 'text-emerald-700',
    value: 'text-emerald-900',
    sub: 'text-emerald-700',
  },
  danger: {
    card: 'border-red-200 bg-red-50',
    label: 'text-red-700',
    value: 'text-red-900',
    sub: 'text-red-700',
  },
  info: {
    card: 'border-blue-200 bg-blue-50',
    label: 'text-blue-700',
    value: 'text-blue-900',
    sub: 'text-blue-700',
  },
};

const classes = computed(() => variantClasses[props.variant]);
</script>

<template>
  <div :class="['min-w-0 rounded-lg border p-3 sm:p-4', classes.card]">
    <p :class="['mb-1 text-xs sm:text-sm font-semibold break-words', classes.label]">
      {{ label }}
    </p>
    <LoaderCircle v-if="loading" class="animate-spin" />
    <template v-else>
      <p
        :class="['text-xl sm:text-2xl lg:text-3xl font-bold break-words', classes.value]"
      >
        {{ value }}
      </p>
      <p
        v-if="subValue"
        :class="['mt-1 text-sm sm:text-base font-semibold break-words', classes.sub]"
      >
        {{ subValue }}
      </p>
    </template>
  </div>
</template>
