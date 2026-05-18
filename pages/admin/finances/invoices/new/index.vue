<script setup lang="ts">
import DatePickerRange from '@/components/shared/DatePickerRange.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/toast/use-toast';
import { LoaderCircle, Receipt } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';
import { currencyFormat, sanitizeAmount } from '~/lib/utils';

import { columns } from './columns';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Gerar Nova Fatura | Urban Mobi',
});

interface CalendarDate {
  era: string;
  year: number;
  month: number;
  day: number;
}

interface DateRange {
  start: CalendarDate;
  end: CalendarDate;
}

const { toast } = useToast();

const contractStore = useContractsStore();
const { getContractsAction } = contractStore;
const { contracts } = storeToRefs(contractStore);

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const invoicesStore = useInvoicesStore();
const { createInvoiceAction } = invoicesStore;
const { isUpdating } = storeToRefs(invoicesStore);

const invoicePeriods = ref<Array<{ label: string; value: string }>>([]);
const loadingRides = ref<boolean>(false);
const invoicesPerPeriod = ref<any>([]);
const selectedRides = ref<any[]>([]);
const selectedContractId = ref<string>('');
const selectedBranchId = ref<string>('all');
const selectedAreaCode = ref<string>('all');
const selectedPeriodMode = ref<string>('monthly');
const selectedMonthlyPeriod = ref<string>('');
const selectedRange = ref<DateRange | null>(null);
const selectedContract = ref<any>(null);
const selectedBranch = ref<any>(null);
const branchAreas = ref<Array<{ label: string; value: string }>>([]);
const showPreviewModal = ref<boolean>(false);
const previewInvoiceNumber = ref<string>('');
const hasAppliedFilters = ref<boolean>(false);

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR');
};

const buildMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

const rideCompletionDate = (ride: any) => {
  const candidate = ride?.progress?.finishedAt || ride?.updatedAt || ride?.createdAt;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getRideLineTotal = (ride: any) => {
  const extraChargesTotal = Array.isArray(ride?.extraCharges)
    ? ride.extraCharges.reduce((acc: number, item: any) => {
        return acc + sanitizeAmount(item?.amount);
      }, 0)
    : 0;

  const withExtras =
    ride?.billing?.ammountWithExtras ?? ride?.billing?.amountWithExtras ?? null;

  const baseTotal =
    sanitizeAmount(withExtras) ||
    sanitizeAmount(ride?.rideFinalPrice) ||
    sanitizeAmount(ride?.billing?.ammount);

  if (sanitizeAmount(withExtras) > 0) {
    return baseTotal;
  }

  return Math.max(baseTotal + extraChargesTotal, 0);
};

const periodDescription = computed(() => {
  if (selectedPeriodMode.value === 'monthly') {
    const selected = invoicePeriods.value.find(
      (period) => period.value === selectedMonthlyPeriod.value,
    );
    return selected?.label || '-';
  }

  if (!selectedRange.value?.start || !selectedRange.value?.end) return '-';

  const start = new Date(
    selectedRange.value.start.year,
    selectedRange.value.start.month - 1,
    selectedRange.value.start.day,
  );
  const end = new Date(
    selectedRange.value.end.year,
    selectedRange.value.end.month - 1,
    selectedRange.value.end.day,
  );
  return `${formatDate(start)} até ${formatDate(end)}`;
});

const invoiceHeader = computed(() => {
  const contract = selectedContract.value;
  const branch = selectedBranch.value;
  const scopeType =
    selectedAreaCode.value !== 'all' && selectedBranchId.value !== 'all'
      ? 'contract-branch-area'
      : selectedBranchId.value !== 'all'
        ? 'contract-branch'
        : 'contract';

  const customerName =
    selectedBranchId.value !== 'all' && branch
      ? `${branch?.branchCode || ''} - ${branch?.fantasyName || branch?.name || ''}`.trim()
      : contract?.customerName || '-';

  const document =
    selectedBranchId.value !== 'all' && branch?.document
      ? branch.document
      : contract?.customer?.document || '-';

  const generatedAt = new Date();
  const paymentDueDays = Number(contract?.comercialConditions?.paymentDueDate || 0);
  const dueDate = new Date(generatedAt);
  dueDate.setDate(dueDate.getDate() + paymentDueDays);

  return {
    scopeType,
    customerName,
    document,
    generatedAt,
    dueDate,
    paymentDueDays,
  };
});

const previewItems = computed(() => {
  return selectedRides.value.map((ride: any) => {
    const branchName = ride?.billing?.paymentData?.branchName || '-all-';
    const areaCode = ride?.billing?.paymentData?.areaCode;
    const areaName = ride?.billing?.paymentData?.areaName;
    const costCenter =
      areaCode || areaName ? `${areaCode || '-'} - ${areaName || 'N/A'}` : '-all-';
    const requester =
      ride?.reason?.requestedByName ||
      ride?.reason?.requestedBy ||
      ride?.user?.name ||
      '-';
    const finishedAt = rideCompletionDate(ride);

    return {
      rideId: ride?.id,
      code: ride?.code,
      user: ride?.user?.name || '-',
      branch: branchName,
      costCenter,
      product: ride?.product?.name || '-',
      requester,
      finishedAt: finishedAt ? formatDate(finishedAt) : '-',
      total: getRideLineTotal(ride),
    };
  });
});

const previewTotal = computed(() => {
  return previewItems.value.reduce(
    (acc: number, item: any) => acc + sanitizeAmount(item.total),
    0,
  );
});

const sanitizeContracts = computed(() => {
  return (contracts?.value || []).map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const contractBranches = computed(() => {
  if (!selectedContract.value?.branches?.length) return [];
  return [
    { label: 'Todas as filiais', value: 'all' },
    ...selectedContract.value.branches.map((branch: any) => ({
      label:
        `${branch.branchCode || ''} - ${branch.fantasyName || branch.name || 'Filial'}`.trim(),
      value: branch.id,
    })),
  ];
});

const canFilterByPeriod = computed(() => {
  if (selectedPeriodMode.value === 'monthly') {
    return Boolean(selectedMonthlyPeriod.value);
  }

  return Boolean(selectedRange.value?.start && selectedRange.value?.end);
});

const canOpenPreview = computed(() => {
  return selectedRides.value.length > 0;
});

const resetFilterResults = () => {
  hasAppliedFilters.value = false;
  invoicesPerPeriod.value = [];
  selectedRides.value = [];
};

const generatePeriods = () => {
  const completedRides = (rides?.value || []).filter(
    (ride: any) => ride?.status === 'completed' && ride?.billing?.status === 'invoice',
  );
  const periodsMap = new Map<string, { label: string; value: string; date: Date }>();

  completedRides.forEach((ride: any) => {
    const completionDate = rideCompletionDate(ride);
    if (!completionDate) return;

    const key = buildMonthKey(completionDate);
    if (periodsMap.has(key)) return;

    const month = completionDate.toLocaleDateString('pt-BR', { month: 'long' });
    const year = completionDate.getFullYear();
    periodsMap.set(key, {
      label: `${month.toUpperCase()} - ${year}`,
      value: key,
      date: new Date(year, completionDate.getMonth(), 1),
    });
  });

  invoicePeriods.value = Array.from(periodsMap.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map(({ label, value }) => ({ label, value }));
};

const applyFilters = () => {
  if (!selectedContractId.value || !canFilterByPeriod.value) {
    invoicesPerPeriod.value = [];
    selectedRides.value = [];
    return;
  }

  let filtered = (rides?.value || []).filter(
    (ride: any) => ride?.status === 'completed' && ride?.billing?.status === 'invoice',
  );

  if (selectedBranchId.value && selectedBranchId.value !== 'all') {
    filtered = filtered.filter(
      (ride: any) => ride?.billing?.paymentData?.branchId === selectedBranchId.value,
    );
  }

  if (selectedAreaCode.value && selectedAreaCode.value !== 'all') {
    filtered = filtered.filter(
      (ride: any) => ride?.billing?.paymentData?.areaCode === selectedAreaCode.value,
    );
  }

  if (selectedPeriodMode.value === 'monthly') {
    const [year, month] = String(selectedMonthlyPeriod.value || '').split('-');
    const yearNumber = Number(year);
    const monthNumber = Number(month);
    if (Number.isNaN(yearNumber) || Number.isNaN(monthNumber)) {
      invoicesPerPeriod.value = [];
      selectedRides.value = [];
      return;
    }

    filtered = filtered.filter((ride: any) => {
      const completionDate = rideCompletionDate(ride);
      if (!completionDate) return false;
      return (
        completionDate.getFullYear() === yearNumber &&
        completionDate.getMonth() + 1 === monthNumber
      );
    });
  }

  if (
    selectedPeriodMode.value === 'range' &&
    selectedRange.value?.start &&
    selectedRange.value?.end
  ) {
    const start = new Date(
      selectedRange.value.start.year,
      selectedRange.value.start.month - 1,
      selectedRange.value.start.day,
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      selectedRange.value.end.year,
      selectedRange.value.end.month - 1,
      selectedRange.value.end.day,
      23,
      59,
      59,
      999,
    );

    filtered = filtered.filter((ride: any) => {
      const completionDate = rideCompletionDate(ride);
      if (!completionDate) return false;
      return completionDate >= start && completionDate <= end;
    });
  }

  invoicesPerPeriod.value = filtered;
  selectedRides.value = [];
};

const onSelectContract = async (contractId: string) => {
  selectedContractId.value = contractId;
  selectedBranchId.value = 'all';
  selectedAreaCode.value = 'all';
  selectedRange.value = null;
  selectedMonthlyPeriod.value = '';
  invoicePeriods.value = [];
  branchAreas.value = [];
  resetFilterResults();

  selectedContract.value = (contracts?.value || []).find(
    (contract: any) => contract.id === contractId,
  );

  loadingRides.value = true;
  try {
    await getRidesByContractAction(contractId);
    generatePeriods();
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Não foi possível carregar os atendimentos do contrato.',
    });
  } finally {
    loadingRides.value = false;
  }
};

const onSelectBranch = (branchId: string) => {
  selectedBranchId.value = branchId;
  selectedAreaCode.value = 'all';

  if (branchId === 'all') {
    selectedBranch.value = null;
    branchAreas.value = [];
    resetFilterResults();
    return;
  }

  selectedBranch.value = selectedContract.value?.branches?.find(
    (branch: any) => branch.id === branchId,
  );

  const areas = Array.isArray(selectedBranch.value?.areas)
    ? selectedBranch.value.areas
    : [];
  branchAreas.value = [
    { label: 'Todos os centros de custo', value: 'all' },
    ...areas
      .filter((area: any) => Boolean(area?.areaCode))
      .map((area: any) => ({
        label: `${area?.areaCode || '000'} - ${area?.areaName || 'N/A'}`,
        value: area?.areaCode,
      })),
  ];

  resetFilterResults();
};

const onSelectArea = (areaCode: string) => {
  selectedAreaCode.value = areaCode;
  resetFilterResults();
};

const onChangePeriodMode = (mode: string) => {
  selectedPeriodMode.value = mode;
  selectedMonthlyPeriod.value = '';
  selectedRange.value = null;
  resetFilterResults();
};

const onSelectMonthlyPeriod = (value: string) => {
  selectedMonthlyPeriod.value = value;
  resetFilterResults();
};

const applyFiltersAndShow = () => {
  if (!selectedContractId.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione um contrato para continuar.',
    });
    return;
  }

  if (!canFilterByPeriod.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description:
        selectedPeriodMode.value === 'monthly'
          ? 'Selecione o mês de referência.'
          : 'Selecione um intervalo de datas válido.',
    });
    return;
  }

  applyFilters();
  hasAppliedFilters.value = true;
};

watch(
  () => selectedRange.value,
  () => {
    if (selectedPeriodMode.value !== 'range') return;
    resetFilterResults();
  },
  { deep: true },
);

const handleSelectionChange = (rows: any[]) => {
  selectedRides.value = rows;
};

const openPreview = () => {
  if (!canOpenPreview.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione ao menos um atendimento para gerar a fatura.',
    });
    return;
  }

  previewInvoiceNumber.value = generateInvoiceNumber();
  showPreviewModal.value = true;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${h}${min}${s}`;
};

const confirmGenerateInvoice = async () => {
  if (previewItems.value.length === 0) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione ao menos um atendimento para gerar a fatura.',
    });
    return;
  }

  const header = invoiceHeader.value;
  const invoiceNumber = previewInvoiceNumber.value || generateInvoiceNumber();

  const payload = {
    number: invoiceNumber,
    period: periodDescription.value,
    description: `Fatura gerada via backoffice (${header.scopeType})`,
    customer: {
      scopeType: header.scopeType,
      contractId: selectedContractId.value,
      branchId: selectedBranchId.value !== 'all' ? selectedBranchId.value : null,
      areaCode: selectedAreaCode.value !== 'all' ? selectedAreaCode.value : null,
      customerName: header.customerName,
      document: header.document,
      generatedAt: header.generatedAt.toISOString(),
      dueDate: header.dueDate.toISOString(),
      paymentDueDays: header.paymentDueDays,
      periodFilter:
        selectedPeriodMode.value === 'monthly'
          ? {
              mode: 'monthly',
              month: selectedMonthlyPeriod.value,
            }
          : {
              mode: 'range',
              startDate: selectedRange.value
                ? new Date(
                    selectedRange.value.start.year,
                    selectedRange.value.start.month - 1,
                    selectedRange.value.start.day,
                  ).toISOString()
                : null,
              endDate: selectedRange.value
                ? new Date(
                    selectedRange.value.end.year,
                    selectedRange.value.end.month - 1,
                    selectedRange.value.end.day,
                    23,
                    59,
                    59,
                    999,
                  ).toISOString()
                : null,
            },
    },
    items: previewItems.value,
    value: Number(previewTotal.value).toFixed(2),
    dueDate: header.dueDate.toISOString(),
    observations: '',
    status: 'open',
  };

  try {
    await createInvoiceAction(payload);
    showPreviewModal.value = false;

    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl hover:text-white',
      description: 'Fatura gerada com sucesso e enviada para faturas em aberto.',
    });

    await navigateTo('/admin/finances/invoices/open');
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Não foi possível gerar a fatura. Tente novamente.',
    });
  }
};

onBeforeMount(async () => {
  await getContractsAction();
});
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
        <section class="mb-6">
          <Card class="bg-zinc-300 shadow-none">
            <CardContent class="py-6 space-y-8">
              <div class="md:max-w-[520px]">
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
                        :label="'Selecione o contrato'"
                        @on-select="onSelectContract"
                        :disabled="false"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>

              <div v-if="selectedContractId" class="md:grid md:grid-cols-2 gap-4">
                <div>
                  <Label class="mb-2 block">Filial (opcional)</Label>
                  <FormSelect
                    :items="contractBranches"
                    :label="'Selecione a filial'"
                    @on-select="onSelectBranch"
                  />
                </div>
                <div>
                  <Label class="mb-2 block">Centro de Custo (opcional)</Label>
                  <FormSelect
                    :items="branchAreas"
                    :label="'Selecione o centro de custo'"
                    :disabled="selectedBranchId === 'all'"
                    @on-select="onSelectArea"
                  />
                </div>
              </div>

              <div
                v-if="selectedContractId"
                :class="
                  selectedPeriodMode === 'range' ? 'md:max-w-[760px]' : 'md:max-w-[520px]'
                "
              >
                <div class="mb-6 flex items-center gap-3">
                  <span
                    class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                  >
                    2
                  </span>
                  <h2 class="text-lg font-bold">Selecione o período dos atendimentos</h2>
                </div>
                <div>
                  <div class="md:grid md:grid-cols-2 gap-4 items-end">
                    <div>
                      <Label class="mb-3 block text-sm font-medium">
                        Modo de período
                      </Label>
                      <RadioGroup
                        :value="selectedPeriodMode"
                        @update:model-value="onChangePeriodMode"
                      >
                        <div class="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="mode-monthly" />
                          <label for="mode-monthly" class="text-sm cursor-pointer">
                            Mensal
                          </label>
                        </div>
                        <div class="flex items-center space-x-2">
                          <RadioGroupItem value="range" id="mode-range" />
                          <label for="mode-range" class="text-sm cursor-pointer">
                            Período específico
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    <FormField v-slot="{ componentField }" name="period">
                      <FormItem>
                        <FormControl>
                          <FormSelect
                            v-if="selectedPeriodMode === 'monthly'"
                            v-bind="componentField"
                            :items="invoicePeriods"
                            :label="'Selecione o mês'"
                            @on-select="onSelectMonthlyPeriod"
                            :disabled="invoicePeriods.length === 0"
                          />
                          <DatePickerRange v-else v-model="selectedRange" />
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </div>

                  <div class="mt-4">
                    <Button
                      type="button"
                      :disabled="!canFilterByPeriod || loadingRides"
                      @click="applyFiltersAndShow"
                    >
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <div v-if="loadingRides">
                  <LoaderCircle :size="24" class="animate-spin text-zinc-900" />
                </div>
                <div v-else-if="hasAppliedFilters && invoicesPerPeriod.length > 0">
                  <div class="mb-6 flex items-center gap-3">
                    <span
                      class="w-8 h-8 flex items-center justify-center text-white bg-zinc-900 rounded-full text-lg"
                    >
                      3
                    </span>
                    <h2 class="text-lg font-bold">
                      Selecione os atendimentos dessa fatura
                    </h2>
                  </div>

                  <div class="p-4 bg-white rounded-md">
                    <DataTable
                      :columns="columns"
                      :data="invoicesPerPeriod"
                      :show-filter="false"
                      :show-column-select="false"
                      :show-pagination="false"
                      @update:selected-rows="handleSelectionChange"
                    />
                  </div>

                  <div class="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p class="text-sm text-zinc-700">
                        {{ selectedRides.length }} atendimento(s) selecionado(s)
                      </p>
                      <p class="text-sm font-bold">
                        Total selecionado: {{ currencyFormat(previewTotal) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="hasAppliedFilters"
                  class="p-4 rounded-md bg-white text-sm text-zinc-700"
                >
                  Nenhum atendimento finalizado foi encontrado para os filtros
                  selecionados.
                </div>
                <div
                  v-else-if="selectedContractId"
                  class="p-4 rounded-md bg-white text-sm text-zinc-700"
                >
                  Selecione os filtros e clique em "Aplicar filtros" para listar os
                  atendimentos.
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        <section>
          <Button
            v-if="hasAppliedFilters && invoicesPerPeriod.length > 0"
            type="button"
            :disabled="!canOpenPreview"
            @click="openPreview"
          >
            Preview da fatura
          </Button>
        </section>
      </form>
    </section>

    <Dialog :open="showPreviewModal" @update:open="(value) => (showPreviewModal = value)">
      <DialogContent class="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Preview da Fatura</DialogTitle>
          <DialogDescription>
            Revise os dados e confirme para finalizar a geração da fatura.
          </DialogDescription>
        </DialogHeader>

        <section
          class="max-h-[70vh] overflow-auto rounded-md border border-zinc-200 bg-white p-8"
        >
          <div
            class="mx-auto w-full max-w-[794px] min-h-[1123px] p-8 border border-zinc-200 bg-white"
          >
            <header
              class="mb-8 border-b border-zinc-200 pb-4 flex items-start justify-between gap-4"
            >
              <div>
                <h3 class="text-2xl font-bold">FATURA</h3>
                <p class="text-sm text-zinc-700">Nº {{ previewInvoiceNumber }}</p>
              </div>
              <img
                src="/images/logo_horizontal_mono.svg"
                alt="Urban Mobi"
                class="h-12 w-auto object-contain"
              />
            </header>

            <section class="mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="font-semibold">Cliente</p>
                <p>{{ invoiceHeader.customerName }}</p>
                <p>CNPJ: {{ invoiceHeader.document }}</p>
              </div>
              <div>
                <p class="font-semibold">Período</p>
                <p>{{ periodDescription }}</p>
                <p>Emissão: {{ formatDate(invoiceHeader.generatedAt) }}</p>
                <p>Vencimento: {{ formatDate(invoiceHeader.dueDate) }}</p>
              </div>
            </section>

            <section>
              <div class="overflow-auto border border-zinc-200 rounded-md">
                <table class="w-full text-xs">
                  <thead class="bg-zinc-100">
                    <tr>
                      <th class="p-2 text-left">Código</th>
                      <th class="p-2 text-left">Usuário</th>
                      <th class="p-2 text-left">Filial</th>
                      <th class="p-2 text-left">Centro de Custo</th>
                      <th class="p-2 text-left">Produto</th>
                      <th class="p-2 text-left">Solicitante</th>
                      <th class="p-2 text-left">Finalização</th>
                      <th class="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in previewItems"
                      :key="item.rideId"
                      class="border-t border-zinc-200"
                    >
                      <td class="p-2">{{ item.code }}</td>
                      <td class="p-2">{{ item.user }}</td>
                      <td class="p-2">{{ item.branch }}</td>
                      <td class="p-2">{{ item.costCenter }}</td>
                      <td class="p-2">{{ item.product }}</td>
                      <td class="p-2">{{ item.requester }}</td>
                      <td class="p-2">{{ item.finishedAt }}</td>
                      <td class="p-2 text-right font-semibold">
                        {{ currencyFormat(item.total) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4 flex justify-end">
                <div
                  class="w-full max-w-sm rounded-md border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div class="flex items-center justify-between text-sm">
                    <span>Total de itens:</span>
                    <span>{{ previewItems.length }}</span>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-base font-bold">
                    <span>Total da fatura:</span>
                    <span>{{ currencyFormat(previewTotal) }}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <DialogFooter>
          <Button variant="outline" @click="() => (showPreviewModal = false)">
            Cancelar
          </Button>
          <Button :disabled="isUpdating" @click="confirmGenerateInvoice">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>

<style scoped></style>
