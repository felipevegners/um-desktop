<script setup lang="ts">
import { useRidesStore } from '#imports';
import DatePickerRange from '@/components/shared/DatePickerRange.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { FileChartColumn, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';

import { columns } from './columns';

definePageMeta({
  layout: 'admin',
  title: 'Relatórios Financeiros - Urban Mobi',
});

defineOptions({
  name: 'FinancesReportsPage',
});

interface CalendarDate {
  era: string;
  year: number;
  month: number;
  day: number;
}

const { toast } = useToast();

const selectedRange = ref<{ start: CalendarDate; end: CalendarDate } | null>(null);

const ridesStore = useRidesStore();
const { getRidesByDateRangeAction } = ridesStore;
const { rides, loadingData } = storeToRefs(ridesStore);

const generateReport = async () => {
  if (!selectedRange.value) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Selecione um período para gerar o relatório.`,
    });
    return;
  }
  try {
    await getRidesByDateRangeAction(selectedRange.value);
    console.log('Rides fetched successfully');
  } catch (error) {
    console.error('Error fetching rides:', error);
  }
};
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
    <section class="p-4 border border-zinc-950 rounded-md">
      <div class="flex flex-col items-start gap-6">
        <h2 class="font-bold text-lg">Atendimentos por período</h2>
        <div class="flex items-end gap-4">
          <DatePickerRange v-model="selectedRange" />
          <Button type="button" @click="generateReport">
            <LoaderCircle v-if="loadingData" class="animate-spin" />
            Gerar Relatório
          </Button>
        </div>
        <pre v-if="!loadingData && rides.length === 0">
Nenhum atendimento encontrado para o período selecionado.</pre
        >
        <pre v-else-if="loadingData">Carregando atendimentos...</pre>
        <pre v-else-if="rides.length > 0">
Total de atendimentos encontrados: {{ rides.length }}</pre
        >
        <DataTable
          :columns="columns"
          :data="rides"
          :loading="loadingData"
          :show-column-select="false"
          :show-filter="false"
          :page-size="20"
        />
      </div>
    </section>
  </main>
</template>

<style scoped></style>
