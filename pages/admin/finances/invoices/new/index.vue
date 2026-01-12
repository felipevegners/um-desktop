<script setup lang="ts">
import { useContractsStore } from '#imports';
import { useRidesStore } from '#imports';
import FormSelect from '@/components/shared/FormSelect.vue';
import { LoaderCircle, Receipt } from 'lucide-vue-next';
import DataTable from '~/components/shared/DataTable.vue';

import { columns } from './columns';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Gerar Nova Fatura | Urban Mobi',
});

const contractStore = useContractsStore();
const { getContractsAction } = contractStore;
const { contracts } = storeToRefs(contractStore);

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const invoicePeriods = ref<Array<{ label: string; value: string }>>([]);
const loadingInvoicePeriods = ref<boolean>(false);
const showPeriodSelect = ref<boolean>(false);
const invoicesPerPeriod = ref<any>([]);
const loadingInvoicesPerPeriod = ref<boolean>(false);
const selectedRides = ref<any[]>([]);

onBeforeMount(async () => {
  await getContractsAction();
});

const sanitizeContracts = computed(() => {
  //@ts-ignore
  return contracts?.value.map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const generatePeriods = async (contractId: string) => {
  loadingInvoicePeriods.value = true;
  await getRidesByContractAction(contractId);

  const filterCompletedRdies = rides?.value.filter(
    (ride: any) => ride.status === 'completed',
  );

  const periodsMap = new Map<string, { label: string; value: string; date: Date }>();

  filterCompletedRdies?.forEach((ride: any) => {
    const rideDate = new Date(ride.createdAt);
    const year = rideDate.getFullYear();
    const monthIndex = rideDate.getMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    if (!periodsMap.has(key)) {
      const month = rideDate.toLocaleDateString('pt-BR', { month: 'long' });
      periodsMap.set(key, {
        label: `${month.toUpperCase()} - ${year}`,
        value: key,
        date: new Date(year, monthIndex, 1),
      });
    }
  });

  const periodsArray = Array.from(periodsMap.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(({ label, value }) => ({ label, value }));

  invoicePeriods.value = periodsArray;
  loadingInvoicePeriods.value = false;
  showPeriodSelect.value = true;
};

const setSelectedPeriod = (value: any) => {
  loadingInvoicesPerPeriod.value = true;
  if (!value) return;
  const parts = String(value).split('-');
  if (parts.length < 2) return;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-based
  if (Number.isNaN(year) || Number.isNaN(month)) return;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1); // exclusive

  const filtered = (rides?.value || []).filter((ride: any) => {
    if (ride.status !== 'completed') return false;
    const d = new Date(ride.createdAt);
    return d >= start && d < end;
  });

  invoicesPerPeriod.value = filtered;
  loadingInvoicesPerPeriod.value = false;
  selectedRides.value = []; // Reset selection when period changes
};

const handleSelectionChange = (rows: any[]) => {
  selectedRides.value = rows;
  // eslint-disable-next-line no-console
  console.log('Selected invoices:', rows);
};
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <Receipt :size="24" />
        Gerar Fatura
      </h1>
    </section>
    <section>
      <form @submit.prevent="" @keydown.enter.prevent="true">
        <section>
          <Card class="bg-zinc-300">
            <CardContent class="py-6 space-y-8">
              <!-- STEP 1 - SELECT CONTRACT -->
              <div class="md:max-w-[450px]">
                <div class="mb-6 flex items-center gap-3">
                  <span
                    class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                  >
                    1
                  </span>
                  <h2 class="text-lg font-bold">Selecione o Contrato</h2>
                </div>
                <FormField v-slot="{ componentField }" name="contract">
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="sanitizeContracts"
                        :label="'Selecione'"
                        @on-select="generatePeriods"
                        :disabled="false"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
              <!-- STEP 2 - SELECT PERIOD -->
              <div class="md:max-w-[450px]">
                <div v-if="loadingInvoicePeriods">
                  <LoaderCircle :size="24" class="animate-spin text-zinc-900" />
                </div>
                <div v-else-if="!loadingInvoicePeriods && showPeriodSelect">
                  <div class="mb-6 flex items-center gap-3">
                    <span
                      class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                    >
                      2
                    </span>
                    <h2 class="text-lg font-bold">Selecione o período</h2>
                  </div>
                  <FormField v-slot="{ componentField }" name="period">
                    <FormItem>
                      <FormControl>
                        <FormSelect
                          v-bind="componentField"
                          :items="invoicePeriods"
                          :label="'Selecione'"
                          @on-select="setSelectedPeriod"
                          :disabled="false"
                        />
                      </FormControl>
                    </FormItem>
                  </FormField>
                </div>
              </div>
              <!-- STEP 3 - SHOW INVOICES -->
              <div>
                <div v-if="loadingInvoicesPerPeriod">
                  <LoaderCircle :size="24" class="animate-spin text-zinc-900" />
                </div>
                <div
                  v-else-if="!loadingInvoicesPerPeriod && invoicesPerPeriod.length > 0"
                >
                  <div class="mb-6 flex items-center gap-3">
                    <span
                      class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                    >
                      3
                    </span>
                    <h2 class="text-lg font-bold">Faturas do Período</h2>
                  </div>
                  <div class="p-4 bg-white rounded-md">
                    <DataTable
                      :columns="columns"
                      :data="invoicesPerPeriod"
                      :show-filter="false"
                      :show-column-select="false"
                      @update:selected-rows="handleSelectionChange"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
