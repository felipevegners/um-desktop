<script setup lang="ts">
defineOptions({
  name: 'ProductTag',
});

const props = defineProps<{
  label: string;
  type: tagType;
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

const classes = [
  'px-2 py-1 uppercase text-center rounded-md w-fit font-bold',
  tagTypeClasses[props.type],
];
</script>
<template>
  <small :class="classes"> {{ label }} </small>
</template>

<style scoped></style>
