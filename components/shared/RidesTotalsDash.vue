<script setup lang="ts">
import { currencyFormat } from '~/lib/utils';

defineOptions({
  name: 'RidesTotalsDash',
});

const props = withDefaults(defineProps<{ rides: any[]; theme?: 'light' | 'dark' }>(), {
  theme: 'dark',
});

const themeClasses = computed(() => {
  return props.theme === 'dark'
    ? 'bg-zinc-950 text-white'
    : 'bg-white text-zinc-950 border border-zinc-950';
});

const calculateRidesPrice = computed(() => {
  return props.rides?.reduce(
    (total: any, ride: any) => total + parseFloat(ride.billing.ammount),
    0,
  );
});

const getInProgressRides = computed(() => {
  return props.rides.filter((ride: any) => ride.status === 'in-progress').length;
});

const getPendingRides = computed(() => {
  return props.rides.filter((ride: any) => ride.status === 'pending').length;
});
</script>
<template>
  <div class="my-10 md:grid md:grid-cols-4 flex items-center justify-start gap-6">
    <div class="p-4 rounded-md" :class="themeClasses">
      <small>Total de atendimentos</small>
      <h3 class="font-bold text-2xl">{{ props.rides.length }}</h3>
    </div>
    <div v-if="getInProgressRides > 0" class="p-4 rounded-md" :class="themeClasses">
      <small> Em Andamento</small>
      <h3 class="font-bold text-2xl">{{ getInProgressRides }}</h3>
    </div>
    <div v-if="getPendingRides > 0" class="p-4 rounded-md" :class="themeClasses">
      <small>Pendentes</small>
      <h3 class="font-bold text-2xl">{{ getPendingRides }}</h3>
    </div>
    <div class="p-4 rounded-md" :class="themeClasses">
      <small>Valor total dos atendimentos</small>
      <h3 class="font-bold text-2xl">
        {{ currencyFormat(calculateRidesPrice as string) }}
      </h3>
    </div>
  </div>
</template>

<style scoped></style>
