<script setup>
import { Search } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';

defineOptions({
  name: 'CurrencyInput',
});
</script>
<template>
  <div class="relative w-full max-w-sm items-center">
    <Input
      type="text"
      v-bind="componentField"
      v-maska="'9##.99#,##'"
      data-maska-tokens="9:[0-9]:repeated"
      data-maska-reversed
      class="pl-9"
    />
    <span
      class="absolute start-0 inset-y-0 flex items-center justify-center px-3 text-sm"
    >
      R$
    </span>
  </div>
</template>

<style lang="scss" scoped></style>
