<script setup lang="ts">
defineOptions({
  name: 'ProductTag',
});

const props = defineProps<{
  label: string;
  type: tagType | string;
}>();

enum tagType {
  EASY = 'EASY',
  PREMIUM = 'PREMIUM',
  GOLD = 'GOLD',
  BLINDADO = 'BLINDADO',
  VAN = 'VAN',
  RECEPTIVO = 'RECEPTIVO',
}

const tagTypeClasses = {
  [tagType.EASY]: 'bg-product-easy text-white',
  [tagType.PREMIUM]: 'bg-product-premium text-white',
  [tagType.GOLD]: 'bg-product-gold text-white',
  [tagType.BLINDADO]: 'bg-product-blindado text-black',
  [tagType.VAN]: 'bg-product-van text-black',
  [tagType.RECEPTIVO]: 'bg-product-receptivo text-black',
};

const resolvedTypeClass = computed(() => {
  const normalizedType = String(props.type || '').toUpperCase();
  return tagTypeClasses[normalizedType as tagType] ?? 'bg-zinc-200 text-zinc-800';
});

const classes = computed(() => [
  'px-2 py-1 uppercase text-center rounded-md w-fit',
  resolvedTypeClass.value,
]);
</script>
<template>
  <small :class="classes"> {{ label }} </small>
</template>

<style scoped></style>
