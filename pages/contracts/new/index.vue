<script setup lang="ts">
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CustomerForm from '@/components/forms/CustomerForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import RatingPriceForm from '@/components/forms/RatingPriceForm.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ref } from 'vue';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Novo Contrato | Urban Mobi',
});

let defaultValue = 'form-1';
</script>
<template>
  <main class="p-6">
    <section class="mb-10 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Novo Contrato</h1>
      <!-- <Button @click="">Trocar</Button> -->
    </section>
    <Accordion
      type="single"
      class="w-full flex flex-col gap-6"
      collapsible
      :default-value="defaultValue"
    >
      <AccordionItem value="form-1" class="bg-zinc-200 rounded-md">
        <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
          1. Dados da Empresa Matriz
        </AccordionTrigger>
        <AccordionContent class="mt-4">
          <CustomerForm />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="form-2" class="bg-zinc-200 rounded-md">
        <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
          2. Gestor Master
        </AccordionTrigger>
        <AccordionContent>
          <MasterManagerForm />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="form-3" class="bg-zinc-200 rounded-md">
        <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
          3. Condições Comerciais
        </AccordionTrigger>
        <AccordionContent>
          <ComercialConditionsForm />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="form-4" class="bg-zinc-200 rounded-md">
        <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
          4. Tarifas
        </AccordionTrigger>
        <AccordionContent>
          <RatingPriceForm />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </main>
</template>

<style scoped></style>
