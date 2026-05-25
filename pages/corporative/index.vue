<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { getNotificationsService } from '@/server/services/notifications';
import '@/stores/contracts.store';
import { useInvoicesStore } from '@/stores/invoices.store';
import { useRidesStore } from '@/stores/rides.store';
import type { NotificationHistoryItem } from '@/utils/notifications';
import {
  CalendarDays,
  ChartArea,
  Coins,
  ExternalLink,
  Inbox,
  LoaderCircle,
  ReceiptText,
} from 'lucide-vue-next';
import { currencyFormat, sanitizeRideDate } from '~/lib/utils';

const { data, status } = useAuth();
const { hasSessionData } = useSessionAccess();
const authUser = computed<any>(() => data.value?.user || {});
const contractId = computed(() => authUser.value?.contract?.contractId);
const userContractBranchId = computed(() =>
  String(authUser.value?.contract?.branchId || '').trim(),
);
const userBranches = computed<any[]>(() => {
  const branches = authUser.value?.contract?.branches;
  return Array.isArray(branches) ? branches : [];
});
const role = computed(() => authUser.value?.role);
const normalizedRole = computed(() =>
  String(role.value || '')
    .trim()
    .toLowerCase(),
);

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { rides, loadingData } = storeToRefs(ridesStore);

const contractStore = useContractsStore();
const { getContractByIdAction } = contractStore;
const { contract, isLoading } = storeToRefs(contractStore);

const invoicesStore = useInvoicesStore();
const { getInvoicesAction } = invoicesStore;
const { invoices, isLoading: isInvoicesLoading } = storeToRefs(invoicesStore);

const contractRidesList = ref<any>([]);
const userAllowedBranches = ref<any>([]);
const isApprovalAlertsLoading = ref(false);
const approvalAlerts = ref<any[]>([]);

const getBranchId = (branch: any) => {
  return String(
    branch?.id ||
      branch?._id ||
      branch?.branchId ||
      branch?.branch?.id ||
      branch?.branch?._id ||
      branch?.branch?.branchId ||
      '',
  ).trim();
};

const getBranchName = (branch: any) => {
  const rawName =
    branch?.branchName ||
    branch?.fantasyName ||
    branch?.name ||
    branch?.companyName ||
    branch?.corporateName ||
    branch?.branch?.branchName ||
    branch?.branch?.fantasyName ||
    branch?.branch?.name ||
    branch?.branch?.companyName;
  const branchName = String(rawName || '').trim();
  return branchName.length > 0 ? branchName : null;
};

const resolveRideBranchId = (ride: any) => {
  return String(
    ride?.billing?.paymentData?.branchId ||
      ride?.billing?.paymentData?.branch ||
      ride?.billing?.branchId ||
      ride?.branchId ||
      ride?.branch?.id ||
      ride?.branch?._id ||
      ride?.user?.branchId ||
      ride?.user?.branch?.id ||
      '',
  ).trim();
};

const isRideCancelled = (ride: any) => {
  const status = String(ride?.status || '')
    .trim()
    .toLowerCase();
  return status === 'cancelled' || status === 'canceled';
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

const allowedBranchIds = computed(() => {
  const ids = userBranches.value
    .map((branch: any) => getBranchId(branch))
    .filter((id: string) => id.length > 0);

  if (userContractBranchId.value.length > 0) {
    return [userContractBranchId.value];
  }

  return ids;
});

const canSeeInvoice = (invoice: any) => {
  if (normalizedRole.value === 'master-manager') return true;
  if (
    normalizedRole.value !== 'branch-manager' &&
    normalizedRole.value !== 'platform-admin' &&
    normalizedRole.value !== 'platform-corp-user'
  )
    return true;

  const branchId = String(invoice?.customer?.branchId || '').trim();
  if (!branchId) return false;
  return allowedBranchIds.value.includes(branchId);
};

const visibleInvoices = computed(() => {
  return (invoices.value || []).filter((invoice: any) => canSeeInvoice(invoice));
});

const recentInvoices = computed(() => {
  return [...visibleInvoices.value]
    .sort((a: any, b: any) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    })
    .slice(0, 6);
});

const pendingApprovalInvoices = computed(() => {
  return visibleInvoices.value.filter((invoice: any) => {
    const status = normalizeInvoiceStatus(invoice?.status);
    return status === 'pending';
  });
});

const buildInvoiceAlert = (invoice: any) => ({
  id: `invoice-${invoice?.id}`,
  type: 'invoice_pending_approval',
  title: `Fechamento #${invoice?.number || invoice?.id || ''} aguardando aprovação`,
  createdAt: invoice?.createdAt || new Date().toISOString(),
  body: {
    invoiceId: invoice?.id,
    invoiceNumber: invoice?.number,
    status: invoice?.status,
  },
});

let pollingInterval: ReturnType<typeof setInterval> | null = null;
const isFetchingDashboard = ref(false);
const hasStartedPolling = ref(false);

const startDashboardPolling = () => {
  if (hasStartedPolling.value) return;
  hasStartedPolling.value = true;
  pollingInterval = setInterval(() => {
    void fetchDashboardData();
  }, 60000);
};

async function fetchDashboardData() {
  if (isFetchingDashboard.value) return;

  const isReady = hasSessionData({
    requireUserId: true,
    requireRole: true,
    requireContractId: true,
  });

  if (!isReady) return;

  const scopedContractId = String(contractId.value || '').trim();
  if (!scopedContractId) return;

  isFetchingDashboard.value = true;

  try {
    const [contractResult, ridesResult, invoicesResult] = await Promise.allSettled([
      getContractByIdAction(scopedContractId),
      getRidesByContractAction(scopedContractId),
      getInvoicesAction({ contractId: scopedContractId }),
    ]);

    try {
      isApprovalAlertsLoading.value = true;
      const notifications = (await getNotificationsService({
        read: false,
        limit: '50',
      })) as NotificationHistoryItem[];

      const notificationAlerts = (Array.isArray(notifications) ? notifications : [])
        .filter((item: NotificationHistoryItem) => {
          return (
            item.type === 'invoice_pending_approval' ||
            item.type === 'invoice_adjustment_requested'
          );
        })
        .map((item: NotificationHistoryItem) => ({
          ...item,
          createdAt: item.createdAt || new Date().toISOString(),
        }));

      const invoiceAlerts =
        invoicesResult.status === 'fulfilled'
          ? pendingApprovalInvoices.value.map(buildInvoiceAlert)
          : [];

      approvalAlerts.value = [...invoiceAlerts, ...notificationAlerts]
        .sort((a: any, b: any) => {
          const da = new Date(a?.createdAt || 0).getTime();
          const db = new Date(b?.createdAt || 0).getTime();
          return db - da;
        })
        .slice(0, 5);
    } catch (error) {
      approvalAlerts.value = [];
    } finally {
      isApprovalAlertsLoading.value = false;
    }

    if (normalizedRole.value === 'master-manager') {
      contractRidesList.value = (rides?.value || []).filter((ride: any) => {
        return !isRideCancelled(ride);
      });
      userAllowedBranches.value = Array.isArray(contract?.value?.branches)
        ? contract.value.branches
        : [];
    } else {
      contractRidesList.value = (rides?.value || []).filter((ride: any) => {
        if (isRideCancelled(ride)) return false;
        const rideBranchId = resolveRideBranchId(ride);
        return rideBranchId.length > 0 && allowedBranchIds.value.includes(rideBranchId);
      });

      const contractBranches = Array.isArray(contract?.value?.branches)
        ? contract.value.branches
        : [];
      const filterUserBranches = contractBranches.filter((item: any) =>
        userBranches.value.some(
          (filterItem: any) => getBranchId(filterItem) === getBranchId(item),
        ),
      );
      userAllowedBranches.value = filterUserBranches;
    }

    if (ridesResult.status === 'rejected') {
      contractRidesList.value = [];
    }

    if (contractResult.status === 'rejected') {
      userAllowedBranches.value = [];
    }

    contractRidesList.value = [...(contractRidesList.value || [])]
      .sort((first: any, second: any) => {
        return resolveRideRecentTimestamp(second) - resolveRideRecentTimestamp(first);
      })
      .slice(0, 4);
  } finally {
    isFetchingDashboard.value = false;
  }
}

watch(
  [status, contractId, normalizedRole],
  async () => {
    const isReady = hasSessionData({
      requireUserId: true,
      requireRole: true,
      requireContractId: true,
    });

    if (!isReady) return;

    await fetchDashboardData();
    startDashboardPolling();
  },
  { immediate: true },
);

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

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
  (contractRidesList.value || []).forEach((ride: any) => {
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

const getBranchRemainingBudgetValue = (branch: any) => {
  return branch.budget - branch.usedBudget;
};

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});

const dashboardEntityName = computed(() => {
  const branchScopedRoles = ['branch-manager', 'platform-admin', 'platform-corp-user'];
  const fallbackCompanyName = contract?.value?.companyName || 'sua empresa';
  const masterManagerCustomerName = String(
    contract?.value?.customerName ||
      contract?.value?.customer?.name ||
      contract?.value?.companyName ||
      '',
  ).trim();

  if (normalizedRole.value === 'master-manager') {
    return masterManagerCustomerName || fallbackCompanyName;
  }

  if (branchScopedRoles.includes(normalizedRole.value)) {
    const contractBranches = Array.isArray(contract?.value?.branches)
      ? contract.value.branches
      : [];

    const branchByUserContractId = contractBranches.find((branch: any) => {
      const branchId = getBranchId(branch);
      return (
        userContractBranchId.value.length > 0 &&
        branchId.length > 0 &&
        branchId === userContractBranchId.value
      );
    });
    if (branchByUserContractId && getBranchName(branchByUserContractId)) {
      return getBranchName(branchByUserContractId) || fallbackCompanyName;
    }

    const allowedBranchWithName = userAllowedBranches.value.find(
      (branch: any) => !!getBranchName(branch),
    );
    if (allowedBranchWithName) {
      return getBranchName(allowedBranchWithName) || fallbackCompanyName;
    }

    const activeBranchFromAuth = userBranches.value.find((branch: any) => {
      const branchId = getBranchId(branch);
      if (userContractBranchId.value.length > 0) {
        return branchId === userContractBranchId.value && !!getBranchName(branch);
      }
      return !!getBranchName(branch);
    });
    if (activeBranchFromAuth) {
      return getBranchName(activeBranchFromAuth) || fallbackCompanyName;
    }

    const matchedContractBranch = contractBranches.find((branch: any) => {
      const branchId = getBranchId(branch);
      return branchId.length > 0 && allowedBranchIds.value.includes(branchId);
    });
    if (matchedContractBranch && getBranchName(matchedContractBranch)) {
      return getBranchName(matchedContractBranch) || fallbackCompanyName;
    }

    if (contractBranches.length === 1 && getBranchName(contractBranches[0])) {
      return getBranchName(contractBranches[0]) || fallbackCompanyName;
    }

    const firstNamedBranch = contractBranches.find(
      (branch: any) => !!getBranchName(branch),
    );
    if (firstNamedBranch) {
      return getBranchName(firstNamedBranch) || fallbackCompanyName;
    }

    return fallbackCompanyName;
  }

  return fallbackCompanyName;
});
</script>

<template>
  <div
    class="my-4 mx-2 sm:my-6 sm:mx-3 flex flex-col gap-4 p-3 sm:p-4 md:p-6 pt-0 min-w-0"
  >
    <div
      class="mb-4 sm:mb-6 w-full rounded-xl bg-gradient-to-l from-um-primary to-black p-[1px]"
    >
      <div class="rounded-[11px] bg-black p-4 sm:p-6">
        <h1 class="font-bold text-base sm:text-lg text-um-primary">Dashboard</h1>
        <p class="text-sm sm:text-base text-white">
          Olá, você está no painel de gestão da empresa
          <strong> {{ dashboardEntityName }}. </strong>
        </p>
      </div>
    </div>

    <div class="grid auto-rows-min gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
      <!-- INVOICES -->
      <div class="rounded-xl bg-muted/90 p-4 sm:p-6 flex flex-col h-full min-h-0 min-w-0">
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
          @click="navigateTo('/corporative/finances/invoices')"
        >
          Ver Fechamentos
        </Button>
      </div>
      <!-- RIDES CHART -->
      <div class="p-4 sm:p-6 flex flex-col rounded-xl bg-muted/90 h-full min-w-0">
        <p class="mb-6 font-bold text-base sm:text-lg">
          <ChartArea class="mb-2" :size="32" />
          Atendimentos por mês
        </p>
        <DashBarChart v-if="getRideMonthData.length" :data="getRideMonthData" />
        <div v-else class="p-10 flex flex-col items-center justify-center h-full">
          <Inbox class="text-muted-foreground" :size="24" />
          <p class="my-3 text-muted-foreground text-sm">Nenhum atendimento no período</p>
        </div>
      </div>
      <!-- BUDGET AND BRANCHES -->
      <div
        class="col-span-1 row-span-1 lg:row-span-2 p-4 sm:p-6 flex flex-col rounded-xl bg-muted/90 gap-6 min-w-0"
      >
        <p class="font-bold text-base sm:text-lg">
          <Coins class="mb-2" :size="32" />
          Budget
        </p>
        <div v-if="isLoading" class="flex items-center justify-center flex-1">
          <LoaderCircle class="text-zinc-950 animate-spin" :size="48" />
        </div>
        <div v-else class="flex flex-col">
          <div>
            <small class="text-muted-foreground">Budget total / mensal</small>
            <h1 class="text-lg sm:text-xl md:text-5xl font-bold break-words">
              {{ currencyFormat(contract?.mainBudget) }}
            </h1>
          </div>
          <div>
            <small class="text-muted-foreground">Budget disponível (não alocado)</small>
            <h1
              class="text-xl sm:text-2xl font-bold break-words"
              :class="contract?.availableBudget > 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{
                currencyFormat(
                  contract?.availableBudget !== null ? contract?.availableBudget : 0,
                )
              }}
            </h1>
          </div>
        </div>
        <div v-for="branch in userAllowedBranches" :key="branch.id">
          <div
            class="border border-zinc-950 rounded-lg bg-muted/80 p-4 mt-4 pt-1 min-w-0"
          >
            <small class="mb-6 font-bold break-words"> {{ branch.fantasyName }}</small>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div>
                <small class="text-muted-foreground">Alocado</small>
                <h1 class="text-lg sm:text-xl font-bold break-words">
                  {{ currencyFormat(branch.budget) }}
                </h1>
              </div>
              <div>
                <small class="text-muted-foreground">Utilizado</small>
                <h1 class="text-lg sm:text-xl font-bold break-words">
                  {{ currencyFormat(branch.usedBudget) }}
                </h1>
              </div>
              <div>
                <small class="text-muted-foreground">Saldo</small>
                <h1
                  class="text-lg sm:text-xl font-bold text-amber-600 break-words"
                  :class="getBranchRemainingBudgetValue(branch) < 0 && 'text-red-600'"
                >
                  {{ currencyFormat(getBranchRemainingBudgetValue(branch)) }}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <Button
          v-if="normalizedRole === 'master-manager'"
          type="button"
          class="mt-6 w-full md:w-fit"
          @click="navigateTo({ path: '/corporative/contracts/edit/', hash: '#budget' })"
        >
          Gerenciar Budget
        </Button>
      </div>
      <!-- RECENT RIDES -->
      <div
        class="col-span-1 sm:col-span-2 p-4 sm:p-6 flex flex-col rounded-xl bg-muted/90 h-full min-w-0"
      >
        <p class="font-bold text-base sm:text-lg">
          <CalendarDays class="mb-2" :size="32" />
          Atendimentos recentes
        </p>
        <div v-if="loadingData" class="flex items-center justify-center h-full">
          <LoaderCircle :size="48" class="animate-spin" />
        </div>
        <ul v-else-if="contractRidesList.length > 0" class="mt-6 flex-1">
          <li
            v-for="(ride, index) in contractRidesList"
            :key="index"
            class="py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 items-start xl:items-center gap-3 border-b border-zinc-300 last-of-type:border-b-0 min-w-0"
          >
            <div class="flex items-center gap-1 min-w-0">
              <p class="text-xs font-bold flex items-center break-all">
                {{ ride.code }}
              </p>
              <Button
                type="button"
                size="icon"
                variant="link"
                @click="navigateTo(`/rides/form/edit/${ride.code || ride.id}`)"
              >
                <ExternalLink :size="16" />
              </Button>
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
            <div class="flex items-center justify-start sm:justify-end gap-2 min-w-0">
              <RideStatusFlag :ride-status="ride.status" />
            </div>
          </li>
        </ul>
        <div v-else class="p-10 flex flex-col items-center justify-center h-full">
          <Inbox class="text-muted-foreground" :size="24" />
          <p class="my-3 text-muted-foreground text-sm">Nenhum atendimento recente</p>
        </div>
        <Button
          v-if="contractRidesList.length > 0"
          type="button"
          class="mt-6 w-full md:w-fit"
          @click="navigateTo('/rides/list/open')"
        >
          Ver Todos
        </Button>
      </div>
    </div>
  </div>
</template>
