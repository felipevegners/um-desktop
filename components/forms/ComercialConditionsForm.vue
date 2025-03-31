<script setup lang="ts">
definePageMeta({
  name: 'ComercialConditionsForm',
});
</script>
<template>
  <section class="px-6">
    <div class="mb-4 md:grid md:grid-cols-2 gap-6">
      <FormField v-slot="{ componentField }" name="paymentTerm">
        <FormItem>
          <FormLabel>Fechamento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="paymentDueDate">
        <FormItem>
          <FormLabel>Faturamento (Dias)</FormLabel>
          <FormControl>
            <Input type="number" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
  </section>
</template>

<style scoped></style>
