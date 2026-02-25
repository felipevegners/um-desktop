<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import DatePickerRange from '@/components/shared/DatePickerRange.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import RidesTotalsDash from '@/components/shared/RidesTotalsDash.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { paymentStatusOptions, rideStatusOptions } from '@/config/status';
import { Filter, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { columns } from '../columns';

const { data } = useAuth();
//@ts-ignore
const contractId = data.value?.user.contract?.contractId;

interface CalendarDate {
  era: string;
  year: number;
  month: number;
  day: number;
}

const { toast } = useToast();

const selectedRange = ref<{ start: CalendarDate; end: CalendarDate } | null>(null);
const filteredRides = ref([]);
const results = ref<any>(null);
const selectedContract = ref<string | null>(null);
const loadingBranches = ref(false);
const loadingAreas = ref(false);
const contractName = ref('');
const selectedBranches = ref<Array<any>>([]);
const contractBranches = ref<Array<any>>([]);
const branchAreas = ref<Array<any>>([]);
const showFilter = ref(false);
const filterTerms = ref<any>({
  contractId: '',
  branchId: '',
  areaCode: '',
  status: '',
  paymentStatus: '',
  driver: '',
  user: '',
});
const ridesUsersList = ref<any>([]);
const availableProducts = ref<any>([]);
const loadingFilters = ref<boolean>(false);

const ridesStore = useRidesStore();
const { getRidesByDateRangeAndContractIdAction } = ridesStore;
const { rides, loadingData } = storeToRefs(ridesStore);

const driversStore = useDriverStore();
const { getDriversAction } = driversStore;
const { drivers } = storeToRefs(driversStore);

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

onMounted(async () => {
  await getDriversAction();
  await getContractByIdAction(contractId);

  filteredRides.value = rides?.value;
  filterRidesUsers();

  loadingBranches.value = true;
  contractName.value = contract?.value.customerName;
  selectedBranches.value = contract?.value.branches;
  contractBranches.value = contract?.value.branches.map((branch: any) => {
    return {
      label: `${branch.branchCode} - ${branch.fantasyName}`,
      value: branch.id,
    };
  });
  ridesUsersList.value = ridesUsersList.value.filter(
    (user: any) => user.contractId === contractId,
  );

  availableProducts.value = contract?.value.products.map((product: any) => ({
    label: product.name,
    value: product.id,
  }));

  setTimeout(() => {
    loadingBranches.value = false;
  }, 500);
});

const filterRidesUsers = () => {
  ridesUsersList.value = rides?.value
    .map((ride: any) => {
      return {
        label: ride.user.name,
        value: ride.user.id,
        contractId: ride.billing.paymentData.contract,
      };
    })
    .filter(
      (item: any, index: number, self: any) =>
        index === self.findIndex((obj: any) => obj.value === item.value),
    );
};

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
    await getRidesByDateRangeAndContractIdAction(selectedRange.value, contractId);
  } catch (error) {
    console.error('Error fetching rides:', error);
  } finally {
    results.value = rides?.value.length;
    filteredRides.value = rides?.value;
    filterRidesUsers();
  }
};

const getBranchAreas = (value: string) => {
  branchAreas.value = [];
  filteredRides.value = rides?.value;

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
};

const applyFilters = () => {
  filteredRides.value = rides?.value;
  loadingFilters.value = true;

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
    const userMatch = filterTerms.value.user
      ? ride.user.id === filterTerms.value.user
      : true;
    const statusMatch =
      filterTerms.value.status && filterTerms.value.status !== 'all'
        ? ride.status === filterTerms.value.status
        : true;
    const paymentStatusMatch =
      filterTerms.value.paymentStatus && filterTerms.value.paymentStatus !== 'all'
        ? ride.billing.status === filterTerms.value.paymentStatus
        : true;
    const driverMatch = filterTerms.value.driver
      ? ride.driver.id === filterTerms.value.driver
      : true;
    const productMatch = filterTerms.value.product
      ? ride.product.id === filterTerms.value.product
      : true;

    return (
      contractMatch &&
      branchMatch &&
      areaMatch &&
      userMatch &&
      statusMatch &&
      paymentStatusMatch &&
      driverMatch &&
      productMatch
    );
  });
  results.value = filtered?.length;
  filteredRides.value = filtered;
  setTimeout(() => {
    loadingFilters.value = false;
  }, 1000);
};

const clearFilters = () => {
  filterTerms.value = {
    contractId: '',
    branchId: '',
    areaCode: '',
    status: '',
    paymentStatus: '',
    driver: '',
    user: '',
  };
  selectedContract.value = null;
  selectedBranches.value = [];
  contractBranches.value = [];
  branchAreas.value = [];
  filteredRides.value = rides?.value;
  filterRidesUsers();
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
        <div class="space-y-4">
          <div v-if="showFilter" class="p-4 border border-zinc-950 bg-white rounded-md">
            <h4 class="font-bold mb-8">Filtrar Resultados</h4>
            <div class="mb-8 md:grid md:grid-cols-3 gap-4">
              <div>
                <Label class="text-sm dark:text-white">Filial</Label>
                <div v-if="loadingBranches" class="p-2 bg-white rounded-md">
                  <LoaderCircle class="animate-spin" />
                </div>
                <FormSelect
                  v-if="!loadingBranches"
                  :items="contractBranches"
                  v-model="filterTerms.branch"
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
                  v-model="filterTerms.areaCode"
                  label="Selecione o centro de custo"
                />
              </div>
            </div>
            <div class="md:grid md:grid-cols-3 gap-4">
              <div>
                <Label class="text-sm dark:text-white">Usuário</Label>
                <FormSelect
                  :items="ridesUsersList"
                  label="Selecione o usuário"
                  v-model="filterTerms.user"
                  :disabled="ridesUsersList.length === 0"
                />
              </div>
              <div>
                <Label class="text-sm dark:text-white">Status do Atendimento</Label>
                <FormSelect
                  :items="rideStatusOptions"
                  label="Selecione o status"
                  v-model="filterTerms.status"
                  :decoration="true"
                />
              </div>
              <div>
                <Label class="text-sm dark:text-white">Status do Pagamento</Label>
                <FormSelect
                  :items="paymentStatusOptions"
                  label="Selecione o status do pagamento"
                  v-model="filterTerms.paymentStatus"
                  :decoration="true"
                />
              </div>
              <div>
                <Label class="text-sm dark:text-white">Produto</Label>
                <FormSelect
                  :items="availableProducts"
                  label="Selecione o produto"
                  v-model="filterTerms.product"
                />
              </div>
            </div>
            <div class="mt-6 flex items-center gap-3">
              <Button type="button" @click="applyFilters">
                <LoaderCircle v-if="false" class="animate-spin" />
                Aplicar
              </Button>
              <Button type="button" variant="ghost" @click="clearFilters">
                Limpar
              </Button>
            </div>
          </div>
          <RidesTotalsDash :rides="filteredRides" theme="dark" />
          <LoaderCircle v-if="loadingData" class="animate-spin" />
          <DataTable
            v-else
            :columns="columns"
            :data="filteredRides"
            :loading="loadingData"
            :show-column-select="false"
            :show-filter="false"
            :show-pagination="false"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
