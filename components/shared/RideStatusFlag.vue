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
};

const renderRideStatus = computed(() => {
  //@ts-ignore
  return rideStatusTranslate[props?.rideStatus];
});
</script>
<template>
  <span
    :class="`py-1 px-2 flex items-center justify-center rounded-md text-white text-[10px] uppercase w-fit  
    ${
      rideStatus === 'created'
        ? 'bg-blue-600'
        : rideStatus === 'accepted'
          ? 'bg-green-600'
          : rideStatus === 'cancelled'
            ? 'bg-red-600'
            : rideStatus === 'completed'
              ? 'bg-zinc-900'
              : 'bg-violet-600'
    }`"
  >
    {{ renderRideStatus }}
  </span>
</template>

<style scoped></style>
