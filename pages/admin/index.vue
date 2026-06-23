<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useCommissionsStore } from '@/stores/commissions.store';
import { useFeeStore } from '@/stores/fees.store';
import { useInvoicesStore } from '@/stores/invoices.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  BanknoteIcon,
  CalendarDays,
  ChartArea,
  ExternalLink,
  LoaderCircle,
  Receipt,
  ReceiptText,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat, sanitizeRideDate } from '~/lib/utils';

const ridesStore = useRidesStore();
const { getRidesAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const commissionsStore = useCommissionsStore();
const { getCommissionsAction } = commissionsStore;
const { commissions } = storeToRefs(commissionsStore);

const feeStore = useFeeStore();
const { getFeeByTypeAction } = feeStore;
const { fee } = storeToRefs(feeStore);

const invoicesStore = useInvoicesStore();
const { getInvoicesAction } = invoicesStore;
const { invoices, isLoading: isInvoicesLoading } = storeToRefs(invoicesStore);

const { data } = useAuth();
const { hasSessionData, status } = useSessionAccess();

const allRides = ref<any>([]);
const accumulatedCommissions = ref<any>(0);
const loadingRides = ref<boolean>(false);
const totalRevenue = ref<string>('');

const normalizeInvoiceStatus = (status: string | undefined | null) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'approved' || raw === 'paid') return 'approved';
  if (raw === 'rejected' || raw === 'canceled' || raw === 'cancelled') return 'rejected';
  if (raw === 'in_adjustment') return 'in_adjustment';
  return 'pending';
};

const invoiceStatusLabel = (status: string | undefined | null) => {
  const normalized = normalizeInvoiceStatus(status);
  if (normalized === 'approved') return 'Aprovado';
  if (normalized === 'rejected') return 'Recusado';
  if (normalized === 'in_adjustment') return 'Em ajuste';
  return 'Pendente';
};

const invoiceStatusClass = (status: string | undefined | null) => {
  const normalized = normalizeInvoiceStatus(status);
  if (normalized === 'approved') return 'bg-green-600';
  if (normalized === 'rejected') return 'bg-red-600';
  if (normalized === 'in_adjustment') return 'bg-blue-600';
  return 'bg-amber-600';
};

const recentInvoices = computed(() => {
  return [...(invoices.value || [])]
    .sort((a: any, b: any) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    })
    .slice(0, 6);
});

const pendingApprovalInvoices = computed(() => {
  return (invoices.value || []).filter((invoice: any) => {
    return normalizeInvoiceStatus(invoice?.status) === 'pending';
  });
});

const isRideCancelled = (ride: any) => {
  const status = String(ride?.status || '')
    .trim()
    .toLowerCase();
  return status === 'cancelled' || status === 'canceled';
};

const resolveRideBillingAmount = (ride: any) => {
  const amountWithExtras = ride?.billing?.ammountWithExtras;
  const baseAmount = ride?.billing?.ammount;
  const valueToUse =
    amountWithExtras !== null && amountWithExtras !== '' ? amountWithExtras : baseAmount;

  const parsedAmount = parseFloat(String(valueToUse || 0));
  return Number.isFinite(parsedAmount) ? parsedAmount : 0;
};

const resolveRideRecentTimestamp = (ride: any) => {
  const rawTimestamp =
    ride?.progress?.startedAt ||
    ride?.updatedAt ||
    ride?.createdAt ||
    ride?.travel?.date ||
    0;

  const timestamp = new Date(rawTimestamp).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});

const hydrateAdminDashboard = async () => {
  loadingRides.value = true;
  try {
    await Promise.allSettled([
      getCommissionsAction(),
      getRidesAction(),
      getInvoicesAction(),
      getFeeByTypeAction('driver_fee'),
    ]);
    allRides.value = [...(rides?.value || [])]
      .filter((ride: any) => !isRideCancelled(ride))
      .sort((first: any, second: any) => {
        return resolveRideRecentTimestamp(second) - resolveRideRecentTimestamp(first);
      })
      .slice(0, 4);
  } finally {
    loadingRides.value = false;
  }
};

const hasHydratedDashboard = ref(false);

watch(
  [status, () => (data.value as any)?.user?.id, () => (data.value as any)?.user?.role],
  async () => {
    if (hasHydratedDashboard.value) return;

    const isReady = hasSessionData({
      requireUserId: true,
      requireRole: true,
    });

    if (!isReady) return;

    hasHydratedDashboard.value = true;
    await hydrateAdminDashboard();
  },
  { immediate: true },
);

const getRideMonthData = computed(() => {
  // Agrupa por mês/ano e status usando chave numérica para ordenar corretamente
  const monthMap: Record<
    string,
    {
      key: number;
      name: string;
      date: Date;
      open: number;
      finished: number;
      cancelled: number;
    }
  > = {};
  (rides?.value || []).forEach((ride: any) => {
    const d = new Date(ride.travel.date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const keyNum = year * 100 + month;
    const name = new Date(Date.UTC(year, month, 1)).toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    });
    const mapKey = String(keyNum);
    if (!monthMap[mapKey])
      monthMap[mapKey] = {
        key: keyNum,
        name,
        date: new Date(Date.UTC(year, month, 1)),
        open: 0,
        finished: 0,
        cancelled: 0,
      };
    if (ride.status === 'completed') monthMap[mapKey].finished++;
    else if (ride.status === 'cancelled') monthMap[mapKey].cancelled++;
    else monthMap[mapKey].open++;
  });
  const sorted = Object.values(monthMap)
    .sort((a, b) => a.key - b.key)
    .map(({ name, date, open, finished, cancelled }) => ({
      name,
      date,
      open,
      finished,
      cancelled,
    }));
  return sorted;
});

const calculateAllRidesPrices = computed(() => {
  const filteredRides = rides?.value.filter((ride: any) => ride.status !== 'cancelled');
  const total = filteredRides.reduce((acc: any, curr: any) => {
    return acc + resolveRideBillingAmount(curr);
  }, 0);

  return total.toString();
});

const calculateOpenRidePrices = computed(() => {
  const filteredRides = rides?.value.filter(
    (ride: any) => ride.status !== 'completed' && ride.status !== 'cancelled',
  );
  const total = filteredRides.reduce((acc: any, curr: any) => {
    return acc + resolveRideBillingAmount(curr);
  }, 0);

  return total.toString();
});
const calculateFinishedRideAmmount = computed(() => {
  const filteredRides = rides?.value.filter((ride: any) => ride.status === 'completed');
  const total = filteredRides?.reduce((acc: any, curr: any) => {
    return acc + resolveRideBillingAmount(curr);
  }, 0);

  const totalCommissions = (total * Number(fee.value.value)) / 100;
  const totalNetRevenue = total - totalCommissions;
  totalRevenue.value = totalNetRevenue.toString();

  return total.toString();
});

const calculateCancelledRideAmmount = computed(() => {
  const filteredRides = rides?.value.filter((ride: any) => ride.status === 'cancelled');
  const total = filteredRides?.reduce((acc: any, curr: any) => {
    return acc + resolveRideBillingAmount(curr);
  }, 0);

  return total.toString();
});

const calculateTotalCommissions = computed(() => {
  const total = commissions.value.reduce((acc: any, curr: any) => {
    const ammount = curr.ammount !== 'NaN' ? parseFloat(curr.ammount) : 0;
    return acc + ammount;
  }, 0);

  return total.toString();
});

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 pt-0 min-w-0">
    <div class="grid auto-rows-min gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
      <!-- CARDS TOTALS -->
      <div
        class="col-span-1 sm:col-span-2 lg:col-span-3 p-4 sm:p-6 flex flex-col rounded-xl min-w-0"
      >
        <div class="flex items-center gap-2 mb-6 min-w-0">
          <Receipt :size="28" class="sm:hidden" />
          <Receipt :size="32" class="hidden sm:block" />
          <p class="font-bold text-base sm:text-lg break-words">Faturamento - Totais</p>
        </div>

        <div>
          <div
            v-if="calculateOpenRidePrices !== ''"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 min-w-0"
          >
            <SharedStatsCard
              label="Total em Atendimentos"
              :value="
                calculateAllRidesPrices === 'NaN'
                  ? ''
                  : currencyFormat(calculateAllRidesPrices)
              "
              variant="default"
              :loading="calculateAllRidesPrices === 'NaN'"
            />
            <SharedStatsCard
              label="Atendimentos em Aberto"
              :value="
                calculateOpenRidePrices === 'NaN'
                  ? ''
                  : currencyFormat(calculateOpenRidePrices)
              "
              variant="warning"
              :loading="calculateOpenRidePrices === 'NaN'"
            />
            <SharedStatsCard
              label="Atendimentos Finalizados"
              :value="
                calculateFinishedRideAmmount === 'NaN'
                  ? ''
                  : currencyFormat(calculateFinishedRideAmmount)
              "
              variant="success"
              :loading="calculateFinishedRideAmmount === 'NaN'"
            />
            <SharedStatsCard
              label="Atendimentos Cancelados"
              :value="
                calculateCancelledRideAmmount === 'NaN'
                  ? ''
                  : currencyFormat(calculateCancelledRideAmmount)
              "
              variant="danger"
              :loading="calculateCancelledRideAmmount === 'NaN'"
            />
            <SharedStatsCard
              label="Repasse Motoristas"
              :value="
                calculateTotalCommissions === 'NaN'
                  ? ''
                  : currencyFormat(calculateTotalCommissions)
              "
              variant="warning"
              :loading="calculateTotalCommissions === 'NaN'"
            />
            <SharedStatsCard
              label="Receita Bruta"
              :value="totalRevenue === 'NaN' ? '' : currencyFormat(totalRevenue)"
              variant="info"
              :loading="totalRevenue === 'NaN'"
            />
          </div>
          <p v-else class="text-muted-foreground">Não há dados no momento.</p>
        </div>
      </div>
      <!-- INVOICES -->
      <div class="p-4 sm:p-6 rounded-xl bg-muted/90 flex flex-col h-full min-h-0 min-w-0">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p class="font-bold text-base sm:text-lg min-w-0 break-words">
            <ReceiptText :size="28" class="sm:hidden" />
            <ReceiptText :size="32" class="hidden sm:block" />
            Fechamentos Operacionais
          </p>
          <span
            class="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-zinc-950 shrink-0"
          >
            {{ pendingApprovalInvoices.length }} pendente(s)
          </span>
        </div>

        <div class="my-4 rounded-xl bg-muted/90 overflow-y-auto flex-1 min-h-0">
          <div v-if="isInvoicesLoading" class="flex items-center justify-center py-8">
            <LoaderCircle :size="48" class="animate-spin" />
          </div>

          <ul v-else-if="recentInvoices.length > 0" class="space-y-2">
            <li
              v-for="invoice in recentInvoices"
              :key="invoice.id"
              class="rounded-lg border border-zinc-300 bg-white p-3 flex flex-wrap items-start justify-between gap-2"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold break-all">{{ invoice.number }}</p>
                <p class="text-xs text-zinc-600 break-words">
                  {{ sanitizeRideDate(invoice.createdAt) }}
                </p>
                <p class="text-sm font-bold mt-1 break-words">
                  {{ currencyFormat(invoice.value) }}
                </p>
              </div>
              <span
                :class="`inline-flex rounded-md px-2 py-1 text-xxs text-white uppercase shrink-0 ${invoiceStatusClass(invoice.status)}`"
              >
                {{ invoiceStatusLabel(invoice.status) }}
              </span>
            </li>
          </ul>

          <div v-else class="mt-4 rounded-lg border border-zinc-300 bg-white p-4">
            <p class="text-sm text-zinc-700">Nenhum fechamento encontrado.</p>
          </div>
        </div>

        <Button
          type="button"
          class="mt-4 w-full md:w-fit"
          @click="navigateTo('/admin/finances/invoices/open')"
        >
          Ver todos
        </Button>
      </div>
      <!-- RIDES CHART -->
      <div class="p-4 sm:p-6 rounded-xl bg-muted/90 min-w-0">
        <p class="mb-6 font-bold text-base sm:text-lg">
          <ChartArea class="mb-2" :size="32" />
          Atendimentos por mês
        </p>
        <DashBarChart :data="getRideMonthData" />
      </div>
      <!-- COMMISSIONS -->
      <div
        class="p-4 sm:p-6 flex flex-col rounded-xl bg-muted/90 max-h-[520px] min-h-0 min-w-0"
      >
        <p class="mb-6 font-bold text-base sm:text-lg">
          <BanknoteIcon class="mb-2" :size="32" />
          Repasse Motoristas
        </p>
        <ul class="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <li
            v-for="commission in commissions"
            class="flex items-center gap-2 justify-between min-w-0"
          >
            <small class="truncate">{{ commission.driver.name }}</small>
            <small class="font-bold shrink-0">{{
              currencyFormat(commission.ammount)
            }}</small>
          </li>
        </ul>
        <div
          class="my-4 p-4 flex items-center justify-between border border-zinc-950 rounded-md"
        >
          <small>Total</small>
          <h1 class="text-3xl font-bold">
            {{ currencyFormat(calculateTotalCommissions) }}
          </h1>
        </div>
        <Button
          type="button"
          class="mt-6 w-full md:w-fit"
          @click="navigateTo('/admin/finances/commissions')"
        >
          Ver todos
        </Button>
      </div>
      <!-- RECENT RIDES -->
      <div
        class="p-4 sm:p-6 col-span-1 sm:col-span-2 rounded-xl bg-muted/90 h-full min-w-0"
      >
        <p class="font-bold text-base sm:text-lg">
          <CalendarDays class="mb-2" :size="32" />
          Atendimentos recentes
        </p>
        <div v-if="loadingRides" class="p-4 md:p-6">
          <LoaderCircle class="animate-spin" :size="48" />
        </div>
        <div v-else>
          <ul class="mt-6">
            <li
              v-for="(ride, index) in allRides"
              :key="index"
              class="py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 items-start xl:items-center gap-3 border-b border-zinc-300 last-of-type:border-b-0 min-w-0"
            >
              <div class="flex min-w-0">
                <p class="text-xs font-bold flex items-center break-all">
                  {{ ride.code }}
                  <Button
                    type="button"
                    size="icon"
                    variant="link"
                    @click="navigateTo(`/rides/form/edit/${ride.code || ride.id}`)"
                  >
                    <ExternalLink :size="16" />
                  </Button>
                </p>
              </div>
              <div
                class="col-span-1 sm:col-span-2 xl:col-span-2 flex flex-col items-start min-w-0"
              >
                <small class="text-xs font-bold">Usuário</small>
                <p class="text-xs text-left break-words">
                  {{ ride?.user.name }} -
                  {{ sanitizeRideDate(ride.travel.date) }}
                </p>
              </div>
              <div class="flex flex-col items-start min-w-0">
                <small class="text-xs font-bold">Motorista</small>
                <small class="text-xs text-left break-words">
                  {{ ride?.driver.name }}</small
                >
              </div>
              <div class="flex items-center justify-start sm:justify-end min-w-0">
                <RideStatusFlag :ride-status="ride.status" />
              </div>
            </li>
          </ul>
          <Button
            type="button"
            class="mt-6 w-full md:w-fit"
            @click="navigateTo('/rides/list/open')"
          >
            Ver todos
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
