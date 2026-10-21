<script setup lang="ts">
import { getRideFinancialSummaryService } from '@/server/services/rides';
import { currencyFormat } from '~/lib/utils';

defineOptions({
  name: 'RidesTotalsDash',
});

const props = withDefaults(defineProps<{ rides: any[]; theme?: 'light' | 'dark' }>(), {
  rides: () => [],
  theme: 'dark',
});

const totalRideAmount = ref(0);
let summaryRequestId = 0;

watch(
  () =>
    props.rides
      .map((ride: any) => String(ride?.id || ''))
      .filter(Boolean)
      .join('|'),
  async (rideIds) => {
    const requestId = ++summaryRequestId;
    if (!rideIds) {
      totalRideAmount.value = 0;
      return;
    }

    try {
      const summary = await getRideFinancialSummaryService(rideIds.split('|'));
      if (requestId === summaryRequestId) totalRideAmount.value = summary.totalAmount;
    } catch {
      if (requestId === summaryRequestId) totalRideAmount.value = 0;
    }
  },
  { immediate: true },
);

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
      :value="currencyFormat(totalRideAmount)"
      variant="success"
    />
  </div>
</template>

<style scoped></style>
