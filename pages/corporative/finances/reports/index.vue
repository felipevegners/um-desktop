<script setup lang="ts">
import { FileChartColumn } from 'lucide-vue-next';

import RidesPerPeriod from './components/RidesPerPeriod.vue';

definePageMeta({
  layout: 'admin',
  title: 'Relatórios Financeiros - Urban Mobi',
});

defineOptions({
  name: 'FinancesReportsPage',
});
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-10 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <FileChartColumn :size="24" />
        Gerar Relatórios Financeiros
      </h1>
    </section>
    <RidesPerPeriod />
  </main>
</template>

<style scoped></style>
