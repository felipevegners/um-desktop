<script setup lang="ts">
defineOptions({
  name: 'CommissionStatusFlag',
});

const props = defineProps<{
  status: string | null;
}>();

const statusTranslate: Record<string, string> = {
  created: 'Lançado',
  paid: 'Pago',
  cancelled: 'Cancelado',
  refused: 'Recusado',
  reversed: 'Estornada',
};

const label = computed(() => statusTranslate[props.status ?? ''] ?? props.status ?? '-');
</script>

<template>
  <span
    :class="`py-1 px-2 flex items-center justify-center rounded-md uppercase w-fit text-xxs
    ${
      status === 'paid'
        ? 'bg-green-600 text-white'
        : status === 'created'
          ? 'bg-blue-600 text-white'
          : status === 'cancelled'
            ? 'bg-red-600 text-white'
            : status === 'refused'
              ? 'bg-orange-500 text-white'
              : status === 'reversed'
                ? 'bg-amber-400 text-black'
                : 'bg-zinc-200 text-zinc-700'
    }`"
  >
    {{ label }}
  </span>
</template>

<style scoped></style>
