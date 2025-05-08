<script setup lang="ts">
import { vMaska } from 'maska/vue';

defineOptions({
  name: 'CurrencyInput',
});

defineProps<{
  label: string;
  componentField: any;
}>();
</script>
<template>
  <FormItem class="relative">
    <FormLabel>{{ label }}</FormLabel>
    <FormControl>
      <Input
        type="text"
        v-bind="componentField"
        v-maska="'9##.99#,##'"
        data-maska-tokens="9:[0-9]:repeated"
        data-maska-reversed
        class="relative pl-9"
      />
      <span
        class="absolute start-0 top-[35px] flex items-center justify-center px-3 text-sm"
      >
        R$
      </span>
      <FormMessage />
    </FormControl>
  </FormItem>
  <!-- <div class="relative w-full max-w-sm items-center">
  </div> -->
</template>

<style lang="scss" scoped></style>
