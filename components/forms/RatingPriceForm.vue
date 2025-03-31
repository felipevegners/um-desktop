<script setup lang="ts">
import { vMaska } from 'maska/vue';

defineOptions({
  name: 'RatingPriceForm',
});
</script>
<template>
  <section class="px-6">
    <div class="mb-4 grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="regularKmPrice">
        <FormItem class="relative">
          <FormLabel>Valor por KM</FormLabel>
          <FormControl>
            <Input v-maska="'R$ ##,##'" type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="hourKmPrice">
        <FormItem class="relative">
          <FormLabel>Valor por KM / Hora</FormLabel>
          <FormControl>
            <Input v-maska="'R$ ##,##'" type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="exceededKmPrice">
        <FormItem class="relative">
          <FormLabel>Valor por KM excedente</FormLabel>
          <FormControl>
            <Input v-maska="'R$ ##,##'" type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="extraKmPrice">
        <FormItem class="relative">
          <FormLabel>Valor por KM Extra</FormLabel>
          <FormControl>
            <Input v-maska="'R$ ##,##'" type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
  </section>
</template>

<style scoped></style>
