<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import DatePickerRange from '@/components/shared/DatePickerRange.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import RidesTotalsDash from '@/components/shared/RidesTotalsDash.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { Filter, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from '../columns';

interface CalendarDate {
  era: string;
  year: number;
  month: number;
  day: number;
}

const { toast } = useToast();

const selectedRange = ref<{ start: CalendarDate; end: CalendarDate } | null>(null);
const filteredRides = ref([]);
const results = ref(null);
const selectedContract = ref<string | null>(null);
const loadingBranches = ref(false);
const loadingAreas = ref(false);
const contractName = ref('');
const selectedBranches = ref<Array<any>>([]);
const contractBranches = ref<Array<any>>([]);
const branchAreas = ref<Array<any>>([]);
const showFilter = ref(false);
const filterTerms = ref({
  contractId: '',
  branchId: '',
  areaCode: '',
});

const ridesStore = useRidesStore();
const { getRidesByDateRangeAction } = ridesStore;
const { rides, loadingData } = storeToRefs(ridesStore);

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;
const { contracts } = storeToRefs(contractsStore);

onMounted(async () => {
  await getContractsAction();
});

const sanitizeContracts = computed(() => {
  return contracts?.value.map((contract: any) => ({
    label: contract.customerName,
    value: contract.id,
  }));
});

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
  } finally {
    results.value = rides?.value.length;
    filteredRides.value = rides?.value;
  }
};

const getContractData = (value: string) => {
  loadingBranches.value = true;

  const filtered = contractsStore.contracts?.find(
    (contract: any) => contract.id === value,
  );
  contractName.value = filtered.customerName;
  selectedBranches.value = filtered.branches;
  contractBranches.value = filtered.branches.map((branch: any) => {
    return {
      label: `${branch.branchCode} - ${branch.fantasyName}`,
      value: branch.id,
    };
  });
  setTimeout(() => {
    loadingBranches.value = false;
  }, 500);

  filterTerms.value = {
    ...filterTerms.value,
    contractId: value,
    branchId: '',
    areaCode: '',
  };
};

const getBranchAreas = (value: string) => {
  loadingAreas.value = true;
  const selectedBranch = selectedBranches.value.find(
    (branch: any) => branch.id === value,
  );

  branchAreas.value = selectedBranch.areas?.map((area: any) => {
    return {
      label: `${area.areaCode !== '' ? area.areaCode : '000'} - ${area.areaName !== '' ? area.areaName : 'Todas'}`,
      value: area.areaCode !== '' ? area.areaCode : 'all',
    };
  });
  setTimeout(() => {
    loadingAreas.value = false;
  }, 500);

  filterTerms.value = {
    ...filterTerms.value,
    branchId: value,
    areaCode: '',
  };
};

const setBranchArea = (value: string) => {
  filterTerms.value.areaCode = value;
};

const applyFilters = () => {
  const filtered = filteredRides?.value.filter((ride: any) => {
    const contractMatch = filterTerms.value.contractId
      ? ride.billing.paymentData.contract === filterTerms.value.contractId
      : true;
    const branchMatch = filterTerms.value.branchId
      ? ride.billing.paymentData.branch === filterTerms.value.branchId
      : true;
    const areaMatch =
      filterTerms.value.areaCode && filterTerms.value.areaCode !== 'all'
        ? ride.billing.paymentData.area === filterTerms.value.areaCode
        : true;

    return contractMatch && branchMatch && areaMatch;
  });
  filteredRides.value = filtered;
};

const clearFilters = () => {
  filterTerms.value = {
    contractId: '',
    branchId: '',
    areaCode: '',
  };
  selectedContract.value = null;
  selectedBranches.value = [];
  contractBranches.value = [];
  branchAreas.value = [];
  filteredRides.value = rides?.value;
};
</script>
<template>
  <section class="p-4 border border-zinc-950 rounded-md">
    <div class="flex flex-col items-start gap-6">
      <h2 class="font-bold text-xl">Atendimentos por período</h2>
      <div class="flex items-end gap-4">
        <DatePickerRange v-model="selectedRange" />
        <div class="flex items-end gap-3">
          <Button type="button" @click="generateReport" class="flex-1">
            <LoaderCircle v-if="loadingData" class="animate-spin" />
            Gerar Relatório
          </Button>
          <Button
            v-if="results !== 0 && results !== null"
            type="button"
            variant="ghost"
            @click="showFilter = !showFilter"
          >
            <Filter :size="16" />
            {{ showFilter ? 'Ocultar filtros' : 'Aplicar filtros' }}
          </Button>
        </div>
      </div>
      <div class="w-full">
        <LoaderCircle v-if="loadingData" class="animate-spin" />
        <div v-if="filteredRides.length > 0" class="space-y-4">
          <div v-if="showFilter" class="p-4 border border-zinc-950 bg-white rounded-md">
            <h4 class="font-bold mb-8">Filtrar Resultados</h4>
            <div class="md:grid md:grid-cols-3 gap-4">
              <div>
                <Label class="text-sm dark:text-white">Contrato</Label>
                <FormSelect
                  :items="sanitizeContracts"
                  v-model="selectedContract"
                  label="Selecione o contrato"
                  @on-select="getContractData"
                />
              </div>
              <div>
                <Label class="text-sm dark:text-white">Filial</Label>
                <div v-if="loadingBranches" class="p-2 bg-white rounded-md">
                  <LoaderCircle class="animate-spin" />
                </div>
                <div
                  v-if="!loadingBranches && !selectedBranches.length"
                  class="bg-zinc-100 rounded-md h-10 cursor-not-allowed"
                />
                <FormSelect
                  v-if="!loadingBranches && selectedBranches.length"
                  :items="contractBranches"
                  label="Selecione a filial"
                  @on-select="getBranchAreas"
                />
              </div>
              <div>
                <Label class="text-sm dark:text-white">Centro de Custo</Label>
                <div v-if="loadingAreas" class="p-2 bg-white rounded-md">
                  <LoaderCircle class="animate-spin" />
                </div>
                <div
                  v-if="!loadingAreas && !branchAreas.length"
                  class="bg-zinc-100 rounded-md h-10 cursor-not-allowed"
                />
                <FormSelect
                  v-if="!loadingAreas && branchAreas.length"
                  :items="branchAreas"
                  label="Selecione o centro de custo"
                  @on-select="setBranchArea"
                />
              </div>
              <div class="mt-6 flex items-center gap-3">
                <Button type="button" @click="applyFilters">
                  <LoaderCircle v-if="false" class="animate-spin" />
                  Aplicar
                </Button>
                <Button type="button" variant="ghost" @click="clearFilters"
                  >Limpar</Button
                >
              </div>
            </div>
          </div>
          <!-- <pre>{{ filterTerms }}</pre> -->
          <RidesTotalsDash :rides="filteredRides" theme="light" />
          <DataTable
            :columns="columns"
            :data="filteredRides"
            :loading="loadingData"
            :show-column-select="false"
            :show-filter="false"
            :show-pagination="false"
          />
        </div>
        <p
          v-if="results === 0 && !loadingData"
          class="text-sm text-red-600 bg-red-100 p-2 rounded-md border border-red-600 w-full"
        >
          Nenhum atendimento encontrado no período selecionado.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
