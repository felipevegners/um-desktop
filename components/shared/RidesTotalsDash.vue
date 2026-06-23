<script setup lang="ts">
import { currencyFormat } from '~/lib/utils';

defineOptions({
  name: 'RidesTotalsDash',
});

const props = withDefaults(defineProps<{ rides: any[]; theme?: 'light' | 'dark' }>(), {
  rides: () => [],
  theme: 'dark',
});

const calculateRidesPrice = computed(() => {
  return props.rides?.reduce((total: any, ride: any) => {
    const amountWithExtras = ride?.billing?.ammountWithExtras;
    const baseAmount = ride?.billing?.ammount;
    const valueToUse =
      amountWithExtras !== null && amountWithExtras !== ''
        ? amountWithExtras
        : baseAmount;

    return total + parseFloat(String(valueToUse || 0));
  }, 0);
});

const getInProgressRides = computed(() => {
  return props.rides.filter((ride: any) => ride.status === 'in-progress').length;
});

const getPendingRides = computed(() => {
  return props.rides.filter((ride: any) => ride.status === 'pending').length;
});
</script>
<template>
  <div class="my-10 grid grid-cols-1 gap-4 md:grid-cols-4">
    <SharedStatsCard
      label="Total de atendimentos"
      :value="props.rides.length"
      variant="default"
    />
    <SharedStatsCard
      v-if="getInProgressRides > 0"
      label="Em Andamento"
      :value="getInProgressRides"
      variant="info"
    />
    <SharedStatsCard
      v-if="getPendingRides > 0"
      label="Pendentes"
      :value="getPendingRides"
      variant="warning"
    />
    <SharedStatsCard
      label="Valor total dos atendimentos"
      :value="currencyFormat(calculateRidesPrice as string)"
      variant="success"
    />
  </div>
</template>

<style scoped></style>
