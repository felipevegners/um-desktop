<script setup lang="ts">
defineOptions({
  name: 'RideStatusFlag',
});
const props = defineProps({
  rideStatus: null,
});

const rideStatusTranslate = {
  created: 'Agendado',
  pending: 'Pendente',
  accepted: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Finalizado',
  refused: 'Recusado',
  'in-progress': 'Em Andamento',
};

const renderRideStatus = computed(() => {
  //@ts-ignore
  return rideStatusTranslate[props?.rideStatus];
});
</script>
<template>
  <span
    :class="`py-1 px-2 flex items-center justify-center rounded-md text-[10px] uppercase w-fit  
    ${
      rideStatus === 'created'
        ? 'bg-blue-600 text-white'
        : rideStatus === 'accepted'
          ? 'bg-green-600 text-white'
          : rideStatus === 'cancelled'
            ? 'bg-red-600 text-white'
            : rideStatus === 'completed'
              ? 'bg-zinc-900 text-white'
              : rideStatus === 'in-progress'
                ? 'bg-violet-600 animate-pulse text-white'
                : rideStatus === 'refused'
                  ? 'bg-red-600 text-white'
                  : 'bg-amber-400 text-black'
    }`"
  >
    {{ renderRideStatus }}
  </span>
</template>

<style scoped></style>
