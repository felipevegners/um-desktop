<script setup lang="ts">
import { vMaska } from 'maska/vue';

defineOptions({
  name: 'CurrencyInput',
});

defineProps<{
  label: string;
  componentField: any;
  styles?: any;
}>();

// const maskedValue = ref('');
// const unmaskedValue = ref('');

// defineExpose({ unmaskedValue });
</script>
<template>
  <FormItem class="relative">
    <FormLabel>{{ label }}</FormLabel>
    <FormControl>
      <Input
        type="text"
        v-bind="componentField"
        v-maska:unmaskedValue.unmasked="'9##.99#,##'"
        data-maska-tokens="9:[0-9]:repeated"
        data-maska-reversed
        class="relative pl-9"
        :class="styles"
      />
      <FormMessage />
    </FormControl>
    <span
      class="absolute start-0 top-[34px] flex items-center justify-center px-3 text-sm"
    >
      R$
    </span>
  </FormItem>
</template>

<style lang="scss" scoped></style>
