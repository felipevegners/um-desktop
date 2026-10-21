<script setup lang="ts">
import InvoicePreviewTable from '@/components/invoices/InvoicePreviewTable.vue';
import DatePickerRange from '@/components/shared/DatePickerRange.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/toast/use-toast';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { previewInvoiceItemsService } from '@/server/services/invoices';
import { LoaderCircle, Receipt, Save } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import DataTable from '~/components/shared/DataTable.vue';
import { convertSecondsToTime, currencyFormat, sanitizeRideDate } from '~/lib/utils';
import {
  resolveDisplayExtraHourPrice,
  resolveDisplayExtraHours,
} from '~/utils/rides/billingExtras';

import { columns } from './columns';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Gerar Novo Fechamento Operacional | Urban Mobi',
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
const { waitForSessionData } = useSessionAccess();

const contractStore = useContractsStore();
const { getContractsAction } = contractStore;
const { contracts } = storeToRefs(contractStore);

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const invoicesStore = useInvoicesStore();
const { createInvoiceAction } = invoicesStore;
const { isUpdating, isLoading } = storeToRefs(invoicesStore);

const invoicePeriods = ref<Array<{ label: string; value: string }>>([]);
const loadingRides = ref<boolean>(false);
const invoicesPerPeriod = ref<any>([]);
const selectedRides = ref<any[]>([]);
const selectedInvoicePreview = ref<any>({ items: [], value: '0.00' });
const allocationsByRideId = ref<Record<string, any>>({});
const isCalculatingAllocations = ref<boolean>(false);
const isCalculatingPreview = ref<boolean>(false);
let allocationRequestId = 0;
let previewRequestId = 0;
const selectedContractId = ref<string>('');
const selectedBranchId = ref<string>('');
const selectedAreaCode = ref<string>('');
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
  const candidate = ride?.progress?.finishedAt || ride?.finishedAt;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getRideRoute = (ride: any) => {
  const origin = String(ride?.travel?.originAddress || '')
    .split('-')
    .slice(0, 1)
    .pop()
    ?.trim();
  const destination = String(ride?.travel?.destinationAddress || '')
    .split('-')
    .slice(0, 1)
    .pop()
    ?.trim();

  if (!origin && !destination) return '-';
  if (!origin) return destination || '-';
  if (!destination) return origin;
  return `${origin} -> ${destination}`;
};

const getRideAddressPart = (address: unknown) =>
  String(address || '')
    .split('-')
    .slice(0, 1)
    .pop()
    ?.trim() || '-';

const getRideDateTime = (ride: any) => {
  const date = ride?.travel?.date ? sanitizeRideDate(ride.travel.date) : '';
  const departTime = String(ride?.travel?.departTime || '').trim();
  if (!date && !departTime) return '-';
  if (!date) return departTime;
  if (!departTime) return date;
  return `${date} ${departTime}`;
};

const normalizeAllocationKey = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
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
  const scopeType = 'contract-branch-area';

  const customerName = branch
    ? `${branch?.branchCode || ''} - ${branch?.fantasyName || branch?.name || ''}`.trim()
    : contract?.customerName || '-';

  const document = branch?.document || contract?.customer?.document || '-';

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
  return selectedRides.value.flatMap((ride: any) => {
    const allocation = selectedInvoicePreview.value.items.find(
      (item: any) => String(item.rideId) === String(ride?.id),
    );
    if (!allocation) return [];

    const invoiceBranchName = ride?.billing?.paymentData?.branchName || '-';
    const rideAreaCode = normalizeAllocationKey(ride?.billing?.paymentData?.areaCode);
    const rideAreaName = ride?.billing?.paymentData?.areaName;
    const splitPayment = Array.isArray(ride?.billing?.paymentData?.splitedPayment)
      ? ride.billing.paymentData.splitedPayment.find((entry: any) => {
          const entryArea = normalizeAllocationKey(entry?.areaCode || entry?.area);
          return entryArea === selectedAreaCode.value;
        })
      : null;

    const requester = ride?.dispatcher?.user || '-';
    const finishedAt = rideCompletionDate(ride);
    const totalTimeStopped = ride?.travel?.totalTimeStopped;
    const tpValue =
      totalTimeStopped !== undefined && totalTimeStopped !== null
        ? convertSecondsToTime(totalTimeStopped)
        : '-';
    const rideExtraKms = ride?.travel?.completedData?.rideExtraKms;
    const kme =
      typeof rideExtraKms === 'number' && rideExtraKms !== 0
        ? rideExtraKms.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
        : '-';
    const computedExtraHours = resolveDisplayExtraHours(ride);
    const he = computedExtraHours > 0 ? String(Math.ceil(computedExtraHours)) : '-';
    const kmePrice =
      ride?.travel?.completedData?.rideExtraKmPrice !== '' &&
      ride?.travel?.completedData?.rideExtraKmPrice !== undefined
        ? currencyFormat(ride?.travel?.completedData?.rideExtraKmPrice)
        : '-';
    const computedExtraHourPrice = resolveDisplayExtraHourPrice(ride);
    const hePrice =
      computedExtraHourPrice > 0 ? currencyFormat(computedExtraHourPrice) : '-';
    return [
      {
        rideId: ride?.id,
        code: ride?.code,
        user: ride?.user?.isVisitor
          ? ride?.user?.visitorData?.name || '-'
          : ride?.user?.name || '-',
        isVisitor: Boolean(ride?.user?.isVisitor),
        driver: ride?.driver?.name || ride?.driver?.fullName || ride?.driverName || '-',
        origin: getRideAddressPart(ride?.travel?.originAddress),
        destination: getRideAddressPart(ride?.travel?.destinationAddress),
        branch: invoiceBranchName,
        costCenter: selectedAreaCode.value || rideAreaCode || rideAreaName || '-',
        product: ride?.product?.name || '-',
        requester,
        openedAt: ride?.createdAt || null,
        finalizedAt: finishedAt,
        dateTime: getRideDateTime(ride),
        route: getRideRoute(ride),
        tp: String(tpValue),
        kme,
        kmePrice,
        he,
        hePrice,
        extraCharges: currencyFormat(allocation.extraChargesTotal),
        baseTotal: allocation.baseTotal,
        allocatedTotal: allocation.allocatedTotal,
        allocationPercentage: allocation.allocationPercentage,
        allocationAreaCode: allocation.allocationAreaCode,
        allocationMode: allocation.allocationMode,
        splitLabel:
          splitPayment?.areaName || splitPayment?.area || allocation.allocationAreaCode,
        total: allocation.allocatedTotal,
        isVisitor: ride?.user?.isVisitor || false,
      },
    ];
  });
});

const previewTotal = computed(() => {
  return selectedInvoicePreview.value.value || '0.00';
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
  return selectedContract.value.branches.map((branch: any) => ({
    label:
      `${branch.branchCode || ''} - ${branch.fantasyName || branch.name || 'Filial'}`.trim(),
    value: branch.id,
  }));
});

const canFilterByPeriod = computed(() => {
  if (!selectedBranchId.value || !selectedAreaCode.value) {
    return false;
  }

  if (selectedPeriodMode.value === 'monthly') {
    return Boolean(selectedMonthlyPeriod.value);
  }

  return Boolean(selectedRange.value?.start && selectedRange.value?.end);
});

const canOpenPreview = computed(
  () =>
    selectedRides.value.length > 0 &&
    previewItems.value.length > 0 &&
    !isCalculatingPreview.value,
);

const resetFilterResults = () => {
  hasAppliedFilters.value = false;
  invoicesPerPeriod.value = [];
  selectedRides.value = [];
  selectedInvoicePreview.value = { items: [], value: '0.00' };
  allocationsByRideId.value = {};
  allocationRequestId += 1;
  previewRequestId += 1;
  isCalculatingAllocations.value = false;
  isCalculatingPreview.value = false;
};

const generatePeriods = () => {
  const completedRides = (rides?.value || []).filter(
    (ride: any) =>
      ride?.status === 'completed' &&
      ['invoice', 'partially_invoiced'].includes(String(ride?.billing?.status || '')),
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

const applyFilters = async () => {
  if (!selectedContractId.value || !canFilterByPeriod.value) {
    invoicesPerPeriod.value = [];
    selectedRides.value = [];
    return;
  }

  let filtered = (rides?.value || []).filter(
    (ride: any) =>
      ride?.status === 'completed' &&
      ['invoice', 'partially_invoiced'].includes(String(ride?.billing?.status || '')),
  );

  filtered = filtered.filter((ride: any) => {
    const rideBranchId = normalizeAllocationKey(ride?.billing?.paymentData?.branchId);
    return rideBranchId === selectedBranchId.value;
  });

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

  if (filtered.length === 0) {
    invoicesPerPeriod.value = [];
    selectedRides.value = [];
    allocationsByRideId.value = {};
    return;
  }

  const requestId = ++allocationRequestId;
  isCalculatingAllocations.value = true;
  try {
    const allocationPreview = await previewInvoiceItemsService({
      rideIds: filtered.map((ride: any) => String(ride.id)),
      areaCode: selectedAreaCode.value,
    });
    if (requestId !== allocationRequestId) return;

    allocationsByRideId.value = Object.fromEntries(
      allocationPreview.items.map((item: any) => [String(item.rideId), item]),
    );
    invoicesPerPeriod.value = filtered.flatMap((ride: any) => {
      const allocation = allocationsByRideId.value[String(ride.id)];
      return allocation ? [{ ...ride, __allocation: allocation }] : [];
    });
  } catch {
    if (requestId === allocationRequestId) {
      invoicesPerPeriod.value = [];
      allocationsByRideId.value = {};
      toast({
        title: 'Opss!',
        variant: 'destructive',
        description: 'Não foi possível calcular os valores dos atendimentos.',
      });
    }
  } finally {
    if (requestId === allocationRequestId) isCalculatingAllocations.value = false;
  }

  selectedRides.value = [];
};

const onSelectContract = async (contractId: string) => {
  selectedContractId.value = contractId;
  selectedBranchId.value = '';
  selectedAreaCode.value = '';
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
  selectedAreaCode.value = '';

  selectedBranch.value = selectedContract.value?.branches?.find(
    (branch: any) => branch.id === branchId,
  );

  const areas = Array.isArray(selectedBranch.value?.areas)
    ? selectedBranch.value.areas
    : [];
  branchAreas.value = areas
    .filter((area: any) => Boolean(area?.areaCode))
    .map((area: any) => ({
      label: `${area?.areaCode || '000'}`,
      value: area?.areaCode,
    }));

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

const applyFiltersAndShow = async () => {
  if (!selectedContractId.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione um contrato para continuar.',
    });
    return;
  }

  if (!selectedBranchId.value || !selectedAreaCode.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione uma filial e um centro de custo para continuar.',
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

  await applyFilters();
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

const handleSelectionChange = async (rows: any[]) => {
  selectedRides.value = rows;
  const requestId = ++previewRequestId;

  if (rows.length === 0) {
    selectedInvoicePreview.value = { items: [], value: '0.00' };
    isCalculatingPreview.value = false;
    return;
  }

  selectedInvoicePreview.value = { items: [], value: '0.00' };
  isCalculatingPreview.value = true;
  try {
    const preview = await previewInvoiceItemsService({
      rideIds: rows.map((ride: any) => String(ride.id)),
      areaCode: selectedAreaCode.value,
    });
    if (requestId === previewRequestId) selectedInvoicePreview.value = preview;
  } catch {
    if (requestId === previewRequestId) {
      selectedInvoicePreview.value = { items: [], value: '0.00' };
      toast({
        title: 'Opss!',
        variant: 'destructive',
        description: 'Não foi possível calcular o total selecionado.',
      });
    }
  } finally {
    if (requestId === previewRequestId) isCalculatingPreview.value = false;
  }
};

const openPreview = () => {
  if (!canOpenPreview.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione ao menos um atendimento para gerar o fechamento.',
    });
    return;
  }

  previewInvoiceNumber.value = generateInvoiceNumber();
  showPreviewModal.value = true;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
};

const confirmGenerateInvoice = async () => {
  if (previewItems.value.length === 0 || isCalculatingPreview.value) {
    toast({
      title: 'Atenção',
      variant: 'destructive',
      description: 'Selecione ao menos um atendimento para gerar o fechamento.',
    });
    return;
  }

  const header = invoiceHeader.value;
  const invoiceNumber = previewInvoiceNumber.value || generateInvoiceNumber();

  const payload = {
    number: invoiceNumber,
    period: periodDescription.value,
    description: `Fechamento gerado via backoffice (${header.scopeType})`,
    customer: {
      scopeType: header.scopeType,
      contractId: selectedContractId.value,
      branchId: selectedBranchId.value,
      areaCode: selectedAreaCode.value,
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
    value: previewTotal.value,
    dueDate: header.dueDate.toISOString(),
    observations: '',
    status: 'pending',
  };

  try {
    await createInvoiceAction(payload);
    showPreviewModal.value = false;

    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl hover:text-white',
      description: 'Fechamento gerado com sucesso.',
    });

    await navigateTo('/admin/finances/invoices/open');
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Não foi possível gerar o fechamento. Tente novamente.',
    });
  }
};

onBeforeMount(async () => {
  const sessionReady = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 10000,
  });

  if (!sessionReady) return;

  await getContractsAction();
});
</script>

<template>
  <main class="p-4 md:p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <Receipt :size="24" />
        Gerar Fechamento Operacional
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
                  <Label class="mb-2 block">Filial</Label>
                  <FormSelect
                    :items="contractBranches"
                    :label="'Selecione a filial'"
                    @on-select="onSelectBranch"
                  />
                </div>
                <div>
                  <Label class="mb-2 block">Centro de Custo</Label>
                  <FormSelect
                    :items="branchAreas"
                    :label="'Selecione o centro de custo'"
                    :disabled="!selectedBranchId"
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
                  <h2 class="text-lg font-bold">Selecione o período</h2>
                </div>
                <div>
                  <div class="md:grid md:grid-cols-2 gap-4 items-end">
                    <div>
                      <Label class="mb-3 block text-sm font-medium">
                        Tipo de período
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
                      :disabled="
                        !canFilterByPeriod || loadingRides || isCalculatingAllocations
                      "
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
                      Selecione os atendimentos desse fechamento
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
                        Total selecionado:
                        {{
                          isCalculatingPreview
                            ? 'Calculando...'
                            : currencyFormat(previewTotal)
                        }}
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
            :disabled="!canOpenPreview || isCalculatingPreview"
            @click="openPreview"
          >
            Preview do fechamento
          </Button>
        </section>
      </form>
    </section>

    <Dialog :open="showPreviewModal" @update:open="(value) => (showPreviewModal = value)">
      <DialogContent class="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Preview do Fechamento Operacional</DialogTitle>
          <DialogDescription>
            Revise os dados e confirme para finalizar a geração do fechamento.
          </DialogDescription>
        </DialogHeader>

        <section
          class="max-h-[70vh] overflow-auto rounded-md border border-zinc-200 bg-white p-8"
        >
          <div class="mx-auto w-full min-h-[1123px] p-8 border border-zinc-200 bg-white">
            <header
              class="mb-8 border-b border-zinc-200 pb-4 flex items-start justify-between gap-4"
            >
              <div>
                <h3 class="text-2xl font-bold">FECHAMENTO OPERACIONAL</h3>
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
                <p><strong>CNPJ:</strong> {{ invoiceHeader.document }}</p>
              </div>
              <div>
                <p class="font-semibold">Período</p>
                <p>{{ periodDescription }}</p>
                <p>
                  <strong>Emissão:</strong> {{ formatDate(invoiceHeader.generatedAt) }}
                </p>
                <p>
                  <strong>Vencimento:</strong> {{ formatDate(invoiceHeader.dueDate) }}
                </p>
              </div>
            </section>

            <InvoicePreviewTable
              :items="previewItems"
              :summary="{
                grossValue: selectedInvoicePreview.grossValue || '0.00',
                allocatedValue: selectedInvoicePreview.value || '0.00',
                splitItemCount: selectedInvoicePreview.splitItemCount || 0,
              }"
            />
          </div>
        </section>

        <DialogFooter>
          <Button variant="outline" @click="() => (showPreviewModal = false)">
            Cancelar
          </Button>
          <Button :disabled="isUpdating" @click="confirmGenerateInvoice">
            <LoaderCircle v-if="isUpdating" class="animate-spin text-white" />
            <Save v-else />
            Gerar Fechamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>
</template>

<style scoped></style>
