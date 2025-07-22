<script setup lang="ts">
defineOptions({
  name: 'RideStatusFlag',
});
const props = defineProps({
  rideStatus: null,
});

const rideStatusTranslate = {
  created: 'Agendado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Finalizado',
  holding: 'Em espera',
};

const renderRideStatus = computed(() => {
  //@ts-ignore
  return rideStatusTranslate[props?.rideStatus];
});
</script>
<template>
  <span
    :class="`p-2 flex items-center justify-center rounded-md text-white text-xs font-bold uppercase w-fit  
    ${
      rideStatus === 'created'
        ? 'bg-blue-600'
        : rideStatus === 'confirmed'
          ? 'bg-green-600'
          : rideStatus === 'cancelled'
            ? 'bg-red-600'
            : rideStatus === 'completed'
              ? 'bg-zinc-900'
              : 'bg-amber-500'
    }`"
  >
    {{ renderRideStatus }}
  </span>
</template>

<style scoped></style>
