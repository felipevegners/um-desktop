<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  CheckCircle2,
  ChevronDown,
  Edit,
  LoaderCircle,
  Paperclip,
  Save,
  Trash,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import {
  convertSecondsToTime,
  currencyFormat,
  sanitizeAmount,
  sanitizeRideDate,
} from '~/lib/utils';
import {
  resolveDisplayExtraHourPrice,
  resolveDisplayExtraHours,
} from '~/utils/rides/billingExtras';

definePageMeta({
  middleware: 'sidebase-auth',
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Editar Fechamento | Urban Mobi',
});

const route = useRoute();
const { toast } = useToast();
const isCorporateRoute = computed(() =>
  String(route.path || '').startsWith('/corporative'),
);

const invoicesStore = useInvoicesStore();
const { getInvoiceByIdAction, getInvoicesAction, updateInvoiceAction } = invoicesStore;
const { invoice, isLoading, isUpdating, invoices } = storeToRefs(invoicesStore);

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { rides, loadingData: isLoadingRides } = storeToRefs(ridesStore);

const normalizeInvoiceStatus = (status: string | undefined | null) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'approved' || raw === 'paid') return 'approved';
  if (raw === 'rejected' || raw === 'canceled' || raw === 'cancelled') return 'rejected';
  if (raw === 'in_adjustment') return 'in_adjustment';
  return 'pending';
};

const routeBasePath = computed(() => {
  const fullPath = String(route.fullPath || route.path || '');
  return fullPath.startsWith('/corporative')
    ? '/corporative/finances/invoices/open'
    : '/admin/finances/invoices/open';
});

const invoiceStatusOptions = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Recusado', value: 'rejected' },
  { label: 'Em ajuste', value: 'in_adjustment' },
];

const invoiceStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
  in_adjustment: 'Em ajuste',
  open: 'Pendente',
  paid: 'Aprovado',
  canceled: 'Recusado',
};

const invoiceStatusClass: Record<string, string> = {
  pending: 'bg-amber-600',
  approved: 'bg-green-600',
  rejected: 'bg-red-600',
  in_adjustment: 'bg-blue-600',
  open: 'bg-amber-600',
  paid: 'bg-green-600',
  canceled: 'bg-red-600',
};

const getInvoiceStatusLabel = (status: string | undefined | null) => {
  const normalized = normalizeInvoiceStatus(status);
  return invoiceStatusLabel[normalized] || 'Pendente';
};

const isInvoiceLocked = computed(
  () => normalizeInvoiceStatus(invoice.value?.status) === 'approved',
);

const selectedStatus = ref<string>('pending');
const observations = ref<string>('');
const currentNfDocument = ref<{ name: string; url: string } | null>(null);
const originalNfDocument = ref<{ name: string; url: string } | null>(null);
const nfFileInput = ref<HTMLInputElement | null>(null);
const isUploadingNf = ref(false);
const isRemovingNf = ref(false);
const invoiceId = ref<string>('');
const originalItems = ref<any[]>([]);
const editableItems = ref<any[]>([]);
const originalRideIds = ref<string[]>([]);
const editMode = ref(false);

const getItemRideId = (item: any) =>
  String(item?.rideId || item?.id || item?.code || '').trim();

const itemSignature = (items: any[]) =>
  items
    .map((item) => getItemRideId(item))
    .filter((rideId) => rideId.length > 0)
    .sort()
    .join('|');

const cloneItems = (items: any[]) => JSON.parse(JSON.stringify(items || []));

const parseRideMoney = (...values: Array<string | number | null | undefined>) => {
  for (const value of values) {
    const amount = sanitizeAmount(value);
    if (amount > 0) return amount;
  }

  return 0;
};

const normalizeScopeId = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const getInvoiceBranchId = () => {
  const customer = invoice.value?.customer as any;
  return normalizeScopeId(
    customer?.branchId || customer?.branch || customer?.paymentData?.branch || '',
  );
};

const getRideBranchId = (ride: any) => {
  return normalizeScopeId(
    ride?.billing?.paymentData?.branch ||
      ride?.billing?.paymentData?.branchId ||
      ride?.billing?.paymentData?.branchName ||
      ride?.customer?.branchId ||
      ride?.customer?.branch ||
      '',
  );
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
};

const invoiceCostCenterCode = computed(() => {
  const customer = (invoice.value?.customer as any) || {};
  const customerCostCenter =
    customer?.areaCode || customer?.costCenter || customer?.costCenterCode || null;
  if (customerCostCenter) return String(customerCostCenter);

  const items = Array.isArray(invoice.value?.items) ? invoice.value.items : [];
  const itemCostCenter =
    items.find((item: any) => item?.allocationAreaCode)?.allocationAreaCode ||
    items.find((item: any) => item?.costCenter)?.costCenter ||
    null;

  return itemCostCenter ? String(itemCostCenter) : '-';
});

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

const getRideDateTime = (ride: any) => {
  const date = ride?.travel?.date ? sanitizeRideDate(ride.travel.date) : '';
  const departTime = String(ride?.travel?.departTime || '').trim();
  if (!date && !departTime) return '-';
  if (!date) return departTime;
  if (!departTime) return date;
  return `${date} ${departTime}`;
};

const buildCostCenterLabel = (ride: any) => {
  const areaCode = ride?.billing?.paymentData?.areaCode;
  const areaName = ride?.billing?.paymentData?.areaName;
  return areaCode || areaName ? `${areaCode}` : '-';
};

const buildRequesterLabel = (ride: any) => {
  return (
    ride?.reason?.requestedByName ||
    ride?.reason?.requestedBy ||
    ride?.requester?.name ||
    ride?.requesterName ||
    ride?.user?.name ||
    '-'
  );
};

const buildInvoiceItemFromRide = (ride: any) => ({
  rideId: ride?.id,
  code: ride?.code || ride?.id || '-',
  user: ride?.user?.name || ride?.user?.fullName || ride?.driver?.name || '-',
  branch:
    ride?.billing?.paymentData?.branchName ||
    ride?.billing?.paymentData?.branch ||
    '-all-',
  costCenter: buildCostCenterLabel(ride),
  product: ride?.billing?.paymentData?.product || ride?.product?.name || '-',
  requester: buildRequesterLabel(ride),
  finishedAt: rideCompletionDate(ride)
    ? formatDate(rideCompletionDate(ride) as Date)
    : '-',
  dateTime: getRideDateTime(ride),
  route: getRideRoute(ride),
  tp:
    ride?.travel?.totalTimeStopped !== undefined &&
    ride?.travel?.totalTimeStopped !== null
      ? String(convertSecondsToTime(ride?.travel?.totalTimeStopped))
      : '-',
  kme:
    typeof ride?.travel?.completedData?.rideExtraKms === 'number' &&
    ride?.travel?.completedData?.rideExtraKms !== 0
      ? ride.travel.completedData.rideExtraKms.toLocaleString('pt-BR', {
          maximumFractionDigits: 2,
        })
      : '-',
  kmePrice:
    ride?.travel?.completedData?.rideExtraKmPrice !== '' &&
    ride?.travel?.completedData?.rideExtraKmPrice !== undefined
      ? currencyFormat(ride?.travel?.completedData?.rideExtraKmPrice)
      : '-',
  he:
    resolveDisplayExtraHours(ride) > 0
      ? String(Math.ceil(resolveDisplayExtraHours(ride)))
      : '-',
  hePrice:
    resolveDisplayExtraHourPrice(ride) > 0
      ? currencyFormat(resolveDisplayExtraHourPrice(ride))
      : '-',
  extraCharges: currencyFormat(
    Array.isArray(ride?.extraCharges)
      ? ride.extraCharges.reduce((acc: number, curr: any) => {
          return acc + sanitizeAmount(curr?.amount);
        }, 0)
      : 0,
  ),
  baseTotal: getRideLineTotal(ride),
  allocatedTotal: getRideLineTotal(ride),
  allocationPercentage: 100,
  allocationAreaCode:
    ride?.billing?.paymentData?.areaCode || ride?.billing?.paymentData?.areaName || '-',
  allocationMode: 'single',
  total: getRideLineTotal(ride),
});

const ridesById = computed(() => {
  return new Map(
    (rides?.value ?? []).map((ride: any) => [String(ride?.id || '').trim(), ride]),
  );
});

const isRideSelected = (rideId: string) => {
  return editableItems.value.some((item) => getItemRideId(item) === rideId);
};

const resolveCandidateItem = (item: any) => {
  const rideId = getItemRideId(item);
  const ride = ridesById.value.get(rideId);
  if (!ride) return item;

  const rideItem = buildInvoiceItemFromRide(ride);
  return {
    ...rideItem,
    ...item,
    baseTotal: item?.baseTotal ?? item?.grossTotal ?? rideItem.baseTotal,
    allocatedTotal:
      item?.allocatedTotal ?? item?.rateioTotal ?? item?.total ?? rideItem.total,
    total: item?.allocatedTotal ?? item?.rateioTotal ?? item?.total ?? rideItem.total,
  };
};

const candidateItems = computed(() => {
  if (isInvoiceLocked.value) {
    return editableItems.value
      .map((item: any) => resolveCandidateItem(item))
      .filter((item: any) => Boolean(getItemRideId(item)));
  }

  const order: string[] = [];
  const itemsMap = new Map<string, any>();

  const register = (item: any) => {
    const rideId = getItemRideId(item);
    if (!rideId) return;
    if (!itemsMap.has(rideId)) {
      order.push(rideId);
    }
    itemsMap.set(rideId, resolveCandidateItem(item));
  };

  originalItems.value.forEach(register);
  editableItems.value.forEach(register);
  availableRides.value.forEach((ride: any) => register(buildInvoiceItemFromRide(ride)));

  return order.map((rideId) => itemsMap.get(rideId)).filter(Boolean);
});

const selectedItems = computed(() => {
  return candidateItems.value.filter((item: any) => isRideSelected(getItemRideId(item)));
});

const selectedItemsTotal = computed(() => {
  return selectedItems.value.reduce((acc: number, item: any) => {
    return acc + sanitizeAmount(item?.total);
  }, 0);
});

const toggleRideSelection = (rideId: string, checked: boolean) => {
  if (isInvoiceLocked.value) return;
  if (!editMode.value) return;
  if (!rideId) return;

  if (checked) {
    const candidate = candidateItems.value.find(
      (item: any) => getItemRideId(item) === rideId,
    );
    if (!candidate || isRideSelected(rideId)) return;
    editableItems.value = [...editableItems.value, candidate];
    return;
  }

  editableItems.value = editableItems.value.filter(
    (item) => getItemRideId(item) !== rideId,
  );
};

const toggleEditMode = () => {
  if (isInvoiceLocked.value) return;
  editMode.value = !editMode.value;
};

const availableRides = computed(() => {
  const selectedRideIds = new Set(editableItems.value.map((item) => getItemRideId(item)));
  const invoiceBranchId = getInvoiceBranchId();
  return (rides?.value ?? []).filter((ride: any) => {
    const rideId = String(ride?.id || '').trim();
    const status = String(ride?.status || '').toLowerCase();
    const billingStatus = String(ride?.billing?.status || '').toLowerCase();
    const rideBranchId = getRideBranchId(ride);
    const matchesBranch =
      !invoiceBranchId || !rideBranchId || rideBranchId === invoiceBranchId;
    return (
      rideId.length > 0 &&
      status === 'completed' &&
      billingStatus === 'invoice' &&
      matchesBranch &&
      !selectedRideIds.has(rideId)
    );
  });
});

const hasItemChanges = computed(
  () =>
    itemSignature(editableItems.value) !== originalRideIds.value.slice().sort().join('|'),
);

const hasNfChanges = computed(() => {
  const currentUrl = currentNfDocument.value?.url || '';
  const originalUrl = originalNfDocument.value?.url || '';
  return currentUrl !== originalUrl;
});

const openNfFilePicker = () => {
  nfFileInput.value?.click();
};

const onNfFileInputChange = (event: Event) => {
  void handleNfFileSelected(event);
};

const handleNfFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target?.files?.[0];
  if (!file) return;

  try {
    isUploadingNf.value = true;
    const formData = new FormData();
    formData.append('file', file);

    const response = await $fetch<{
      data?: { name?: string; key?: string; url?: string };
    }>('/api/files?endpoint=driverFiles', {
      method: 'POST',
      body: formData,
    });

    const uploaded = response?.data;
    if (!uploaded?.url) {
      throw new Error('upload_missing_url');
    }

    currentNfDocument.value = {
      name: uploaded.name || file.name || 'Documento NF',
      url: uploaded.url,
    };

    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: 'NF enviada com sucesso!',
    });
  } catch (error: any) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: error?.data?.message || 'Erro no upload da NF. Tente novamente.',
    });
  } finally {
    isUploadingNf.value = false;
    if (target) {
      target.value = '';
    }
  }
};

const removeCurrentNf = async () => {
  if (isInvoiceLocked.value) return;
  if (!currentNfDocument.value?.url) return;

  try {
    isRemovingNf.value = true;
    await $fetch('/api/files', {
      method: 'DELETE',
      body: { fileUrl: currentNfDocument.value.url },
    });

    currentNfDocument.value = null;

    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: 'NF removida com sucesso. Você já pode anexar outra.',
    });
  } catch (error: any) {
    toast({
      title: 'Oops!',
      variant: 'destructive',
      description: error?.data?.message || 'Não foi possível remover a NF.',
    });
  } finally {
    isRemovingNf.value = false;
  }
};

const resolveInvoiceByParam = async () => {
  const idOrNumber = String(route.params.id || '').trim();
  if (!idOrNumber) return;

  const looksLikeObjectId = /^[a-f0-9]{24}$/i.test(idOrNumber);
  if (looksLikeObjectId) {
    try {
      await getInvoiceByIdAction(idOrNumber);
      invoiceId.value = idOrNumber;
      return;
    } catch (error) {
      // fallback by number search
    }
  }

  await getInvoicesAction({ number: idOrNumber });
  const matched = (invoices.value || []).find(
    (item: any) => String(item?.number || '').toLowerCase() === idOrNumber.toLowerCase(),
  );

  if (!matched?.id) {
    throw new Error('invoice_not_found');
  }

  invoiceId.value = matched.id;
  await getInvoiceByIdAction(matched.id);
};

const loadContractRides = async () => {
  const contractId = String(invoice.value?.customer?.contractId || '').trim();
  if (!contractId) return;

  try {
    await getRidesByContractAction(contractId);
  } catch (error) {
    // The page still works without the add-item list.
  }
};

watch(
  () => invoice.value,
  async (value) => {
    if (!value) return;
    selectedStatus.value = normalizeInvoiceStatus(value.status);
    observations.value = value.observations || '';
    originalItems.value = cloneItems(Array.isArray(value.items) ? value.items : []);
    editableItems.value = cloneItems(Array.isArray(value.items) ? value.items : []);
    originalRideIds.value = editableItems.value.map((item) => getItemRideId(item));
    editMode.value = false;

    const tracking = value?.customer?.invoiceTracking;
    if (tracking?.nfDocument?.url) {
      currentNfDocument.value = {
        name: tracking.nfDocument.name || 'Documento NF',
        url: tracking.nfDocument.url,
      };
      originalNfDocument.value = {
        name: tracking.nfDocument.name || 'Documento NF',
        url: tracking.nfDocument.url,
      };
    } else {
      currentNfDocument.value = null;
      originalNfDocument.value = null;
    }

    await loadContractRides();
  },
  { immediate: true },
);

const saveInvoice = async () => {
  if (isInvoiceLocked.value && !hasNfChanges.value) {
    toast({
      title: 'Fechamento aprovado',
      description: 'Este fechamento está aprovado e apenas a NF pode ser atualizada.',
    });
    return;
  }

  if (!invoiceId.value) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Fechamento não encontrado para atualização.',
    });
    return;
  }

  try {
    const saveWithItems = hasItemChanges.value;
    const statusToSave = saveWithItems ? 'pending' : selectedStatus.value;

    await updateInvoiceAction(invoiceId.value, {
      status: statusToSave,
      observations: observations.value,
      nfDocument: currentNfDocument.value ?? null,
      items: selectedItems.value,
    });

    toast({
      title: 'Sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: 'Fechamento atualizado com sucesso.',
    });

    await navigateTo(routeBasePath.value);
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Não foi possível salvar o fechamento.',
    });
  }
};

onBeforeMount(async () => {
  try {
    await resolveInvoiceByParam();
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: 'Fechamento não encontrado.',
    });
    await navigateTo(routeBasePath.value);
  }
});
</script>

<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>

    <section class="mb-6 rounded-md border border-zinc-200 bg-white p-4">
      <div
        class="flex flex-col gap-4 border-b border-zinc-200 pb-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <h1 class="text-lg font-bold uppercase tracking-wide text-zinc-900">
            Fechamento por período
          </h1>
          <p class="mt-1 text-sm text-zinc-700">Nº {{ invoice?.number || '-' }}</p>
        </div>
        <div class="text-sm text-zinc-600">
          <span
            class="inline-flex rounded-md px-2 py-1 text-xxs text-white uppercase"
            :class="
              invoiceStatusClass[normalizeInvoiceStatus(selectedStatus)] || 'bg-zinc-700'
            "
          >
            {{ getInvoiceStatusLabel(selectedStatus) }}
          </span>
        </div>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p class="font-bold text-zinc-900">Cliente</p>
          <p class="mt-2 text-sm text-zinc-700">
            {{ invoice?.customer?.customerName || '-' }}
          </p>

          <p class="text-sm text-zinc-700">
            <strong>Centro de Custo:</strong> {{ invoiceCostCenterCode }}
          </p>

          <p class="text-sm text-zinc-700">
            <strong>CNPJ:</strong> {{ invoice?.customer?.document || '-' }}
          </p>
        </div>

        <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p class="font-bold text-zinc-900">Período</p>
          <p class="mt-2 text-sm text-zinc-700">{{ invoice?.period || '-' }}</p>
          <p class="text-sm text-zinc-700">
            <strong>Emissão:</strong> {{ formatDate(invoice?.createdAt) }}
          </p>
          <p class="text-sm text-zinc-700">
            <strong>Vencimento:</strong> {{ formatDate(invoice?.dueDate) }}
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-md border border-zinc-200 bg-white p-4">
      <div v-if="isCorporateRoute" class="space-y-4 py-10 text-center">
        <p class="text-sm font-semibold text-zinc-900">Revisão corporativa</p>
        <p class="text-sm text-zinc-600">
          O fluxo corporativo foi movido para o preview da listagem. Abra o fechamento na
          tela de fechamentos para aprovar ou solicitar ajuste.
        </p>
        <Button type="button" @click="navigateTo('/corporative/finances/invoices')">
          Voltar para a listagem
        </Button>
      </div>

      <template v-else>
        <div v-if="isLoading" class="flex items-center justify-center py-10">
          <LoaderCircle class="animate-spin" :size="24" />
        </div>

        <div v-else-if="!invoice" class="py-10 text-center text-sm text-zinc-600">
          Fechamento não encontrado.
        </div>

        <div v-else class="space-y-6">
          <div
            v-if="isInvoiceLocked"
            class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"
          >
            Este fechamento está aprovado. Apenas o anexo da NF pode ser alterado.
          </div>

          <section class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-bold text-zinc-900">Atendimentos deste Fechamento</p>
                <small class="text-xs text-muted-foreground">
                  Selecione os atendimentos que devem compor o fechamento.
                </small>
              </div>
              <span class="rounded-md bg-zinc-900 px-3 py-1 text-xs text-white">
                {{ selectedItems.length }} item(ns)
              </span>
            </div>

            <div class="mt-4 overflow-auto rounded-md border border-zinc-200 bg-white">
              <table class="w-full text-[11px]">
                <thead class="bg-zinc-100">
                  <tr>
                    <th class="p-2 text-center">Selecionar</th>
                    <th class="p-2 text-left">Código</th>
                    <th class="p-2 text-left">Usuário</th>
                    <th class="p-2 text-left">Filial</th>
                    <th class="p-2 text-left">CC</th>
                    <th class="p-2 text-left">Produto</th>
                    <th class="p-2 text-left">Solicitante</th>
                    <th class="p-2 text-left">Finalizado</th>
                    <th class="p-2 text-left">Data e Hora</th>
                    <th class="p-2 text-left">Rota</th>
                    <th class="p-2 text-center">TP</th>
                    <th class="p-2 text-left">KME</th>
                    <th class="p-2 text-left">Valor KME</th>
                    <th class="p-2 text-left">HE</th>
                    <th class="p-2 text-left">Valor HE</th>
                    <th class="p-2 text-center">Adicionais</th>
                    <th class="p-2 text-center">Valor Total</th>
                    <th class="p-2 text-center">Valor Rateado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoadingRides" class="border-t border-zinc-200">
                    <td colspan="18" class="p-4 text-center text-sm text-zinc-600">
                      Carregando atendimentos do contrato...
                    </td>
                  </tr>
                  <tr
                    v-else-if="candidateItems.length === 0"
                    class="border-t border-zinc-200"
                  >
                    <td colspan="18" class="p-4 text-center text-sm text-zinc-600">
                      Nenhum atendimento disponível para este fechamento.
                    </td>
                  </tr>
                  <tr
                    v-for="item in candidateItems"
                    v-else
                    :key="getItemRideId(item)"
                    class="border-t border-zinc-200"
                  >
                    <td class="p-2 text-center">
                      <Checkbox
                        :checked="isRideSelected(getItemRideId(item))"
                        :disabled="
                          isInvoiceLocked || !editMode || isUpdating || isLoadingRides
                        "
                        @update:checked="
                          (checked) =>
                            toggleRideSelection(getItemRideId(item), checked === true)
                        "
                      />
                    </td>
                    <td class="p-2">{{ item.code }}</td>
                    <td class="p-2">{{ item.user }}</td>
                    <td class="p-2">{{ item.branch }}</td>
                    <td class="p-2">{{ item.costCenter }}</td>
                    <td class="p-2">{{ item.product }}</td>
                    <td class="p-2">{{ item.requester }}</td>
                    <td class="p-2">{{ item.finishedAt }}</td>
                    <td class="p-2">{{ item.dateTime }}</td>
                    <td class="p-2">{{ item.route }}</td>
                    <td class="p-2 text-center">{{ item.tp }}</td>
                    <td class="p-2">{{ item.kme }}</td>
                    <td class="p-2">{{ item.kmePrice }}</td>
                    <td class="p-2">{{ item.he }}</td>
                    <td class="p-2">{{ item.hePrice }}</td>
                    <td class="p-2 text-center font-semibold">
                      {{ currencyFormat(item.baseTotal ?? item.total) }}
                    </td>
                    <td class="p-2 text-center font-semibold">
                      {{ currencyFormat(item.allocatedTotal ?? item.total) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 flex justify-end">
              <div class="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-4">
                <div class="flex items-center justify-between text-sm">
                  <span>Total de atendimentos selecionados:</span>
                  <span>{{ selectedItems.length }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between text-base font-bold">
                  <span>Total geral:</span>
                  <span>{{ currencyFormat(selectedItemsTotal) }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3 flex justify-start">
              <Button
                type="button"
                class="min-w-28"
                :disabled="isInvoiceLocked || isUpdating || isLoadingRides"
                @click="toggleEditMode"
              >
                <Edit v-if="!editMode" />
                <Save v-else />
                {{ editMode ? 'Salvar' : 'Editar' }}
              </Button>
            </div>

            <p v-if="hasItemChanges" class="mt-3 text-xs font-medium text-amber-700">
              Alterações nos itens irão reiniciar a janela de aprovação quando o
              fechamento for salvo.
            </p>
          </section>

          <div>
            <Label class="mb-2 block">Status</Label>
            <div class="relative w-fit">
              <select
                v-model="selectedStatus"
                :disabled="isInvoiceLocked || isUpdating"
                class="w-fit appearance-none rounded-md border border-zinc-300 bg-white py-3 pl-3 pr-10 text-sm"
              >
                <option
                  v-for="option in invoiceStatusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <ChevronDown
                class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              />
            </div>
          </div>

          <div>
            <Label class="mb-2 block text-amber-700">Observações</Label>
            <textarea
              v-model="observations"
              :disabled="isInvoiceLocked || isUpdating"
              rows="4"
              class="w-full rounded-md border border-amber-700 bg-white px-3 py-2 text-sm"
              placeholder="Observações do fechamento"
            />
          </div>

          <div class="space-y-2">
            <Label class="block">Nota Fiscal</Label>
            <input
              ref="nfFileInput"
              type="file"
              class="hidden"
              accept=".pdf,image/*"
              @change="onNfFileInputChange"
            />
            <Button
              type="button"
              class="bg-zinc-900 hover:bg-zinc-700 text-white"
              :disabled="isUploadingNf || isRemovingNf || !!currentNfDocument?.url"
              @click="openNfFilePicker"
            >
              <LoaderCircle v-if="isUploadingNf" class="mr-2 h-4 w-4 animate-spin" />
              <Paperclip v-else class="mr-2 h-4 w-4" />
              {{ isUploadingNf ? 'Enviando arquivo...' : 'Anexar NF' }}
            </Button>
            <p
              v-if="currentNfDocument?.url"
              class="flex items-center gap-1 text-xs text-green-700"
            >
              <CheckCircle2 class="h-4 w-4" />
              NF anexada com sucesso.
            </p>
            <div v-if="currentNfDocument?.url" class="flex items-center gap-2">
              <a
                :href="currentNfDocument.url"
                target="_blank"
                class="text-xs text-blue-600 underline"
              >
                Ver NF ({{ currentNfDocument.name }})
              </a>
              <Button
                type="button"
                variant="ghost"
                class="h-7 px-2 text-red-600"
                :disabled="isInvoiceLocked || isRemovingNf"
                @click="removeCurrentNf"
              >
                <LoaderCircle v-if="isRemovingNf" class="mr-1 h-4 w-4 animate-spin" />
                <Trash v-else class="mr-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </template>
    </section>
    <section class="py-6">
      <div class="flex items-center gap-2">
        <Button
          type="button"
          :disabled="isUpdating || (isInvoiceLocked && !hasNfChanges)"
          @click="saveInvoice"
        >
          <LoaderCircle v-if="isUpdating" class="mr-2 animate-spin" :size="16" />
          Salvar alterações
        </Button>
        <Button type="button" variant="outline" @click="navigateTo(routeBasePath)">
          Cancelar
        </Button>
      </div>
    </section>
  </main>
</template>
