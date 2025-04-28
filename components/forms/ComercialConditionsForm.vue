<script setup lang="ts">
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import { Info } from 'lucide-vue-next';

definePageMeta({
  name: 'ComercialConditionsForm',
});
</script>
<template>
  <section class="px-6">
    <div class="mb-6"></div>
    <div class="mb-4 flex items-end gap-10">
      <FormField v-slot="{ componentField }" name="mainBudget">
        <FormItem class="max-w-[350px]">
          <div class="flex flex-col">
            <FormLabel> Budget do Contrato </FormLabel>
            <small class="mt-2 flex items-center gap-1 text-muted-foreground">
              <Info :size="14" />
              Valor usado para definir investimento por filial</small
            >
          </div>
          <FormControl>
            <CurrencyInput v-bind="componentField" />
          </FormControl>
          <FormMessage class="absolute" />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="paymentTerm">
        <FormItem>
          <div class="flex flex-col">
            <FormLabel>Fechamento</FormLabel>
            <small class="mt-2 flex items-center gap-1 text-muted-foreground">
              <Info :size="14" />
              Condição de fechamento de fatura</small
            >
          </div>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage class="absolute" />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="paymentDueDate">
        <FormItem>
          <div class="flex flex-col">
            <FormLabel>Faturamento (Dias)</FormLabel>
            <small class="mt-2 flex items-center gap-1 text-muted-foreground">
              <Info :size="14" />
              Vencimento da fatura do cliente</small
            >
          </div>
          <FormControl>
            <Input type="number" v-bind="componentField" />
          </FormControl>
          <FormMessage class="absolute" />
        </FormItem>
      </FormField>
    </div>
  </section>
</template>

<style scoped></style>
