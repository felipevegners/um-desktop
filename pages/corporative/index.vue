<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
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

const { data } = useAuth();
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

async function fetchDashboardData() {
  if (!contractId.value) return;

  await Promise.all([
    getContractByIdAction(contractId.value),
    getRidesByContractAction(contractId.value),
    getInvoicesAction({ contractId: contractId.value }),
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

    const invoiceAlerts = pendingApprovalInvoices.value.map(buildInvoiceAlert);

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
    contractRidesList.value = rides?.value.filter(
      (ride: any) => ride.status !== 'cancelled',
    );
    userAllowedBranches.value = contract?.value.branches;
  } else {
    contractRidesList.value = rides?.value.filter((ride: any) =>
      allowedBranchIds.value.some(
        (filterItem: any) =>
          filterItem === String(ride?.billing?.paymentData?.branch || '').trim() &&
          ride.status !== 'cancelled',
      ),
    );

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

  if (contractRidesList.value.length >= 4) {
    contractRidesList.value = contractRidesList?.value.slice(-4).reverse();
  }
}

onMounted(async () => {
  await fetchDashboardData();
  pollingInterval = setInterval(fetchDashboardData, 60000); // 60s
});

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

// const contractRemainBudget = computed(() => {
//   if (contract?.value) {
//     return contract?.value.mainBudget - contract.value.usedBudget;
//   }
//   return 0;
// });
</script>

<template>
  <div class="my-6 mx-3 flex flex-col gap-4 md:p-6 pt-0">
    <!-- <div
      class="p-6 md:p-6 md:h-[240px] flex flex-col md:flex-row items-center justify-between rounded-xl bg-zinc-950 md:bg-[url('/images/dashboard_banner_background.jpg')] bg-no-repeat bg-cover bg-center"
    >
      <div class="flex flex-col gap-6">
        <h2 class="text-white">Olá, {{ userName }}!</h2>
        <h1 class="font-bold text-white md:text-2xl">
          Você está no painel de gestão da Urban Mobi
        </h1>
      </div>
      <Button
        type="button"
        class="p-6 mt-10 md:mt-0 w-full md:w-fit bg-um-primary hover:bg-um-primary/80 text-black uppercase font-bold md:shadow-lg"
        @click="navigateTo('/rides/form/new')"
      >
        <CalendarPlus :size="18" />
        Solicitar Atendimento
      </Button>
    </div> -->

    <div class="p-6 w-full rounded-xl border border-zinc-950">
      <h1 class="font-bold text-lg">Dashboard</h1>
      Olá, você está no painel de gestão da
      <strong> {{ dashboardEntityName }}. </strong>
    </div>

    <div class="flex flex-col md:grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="rounded-xl bg-muted/90 p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <p class="font-bold text-lg">
            <ReceiptText :size="32" />
            Fechamentos Operacionais
          </p>
          <span
            class="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-zinc-950"
          >
            {{ pendingApprovalInvoices.length }} pendente(s)
          </span>
        </div>

        <!-- <div v-if="isApprovalAlertsLoading" class="flex items-center justify-center py-8">
          <LoaderCircle :size="28" class="animate-spin" />
        </div> -->

        <!-- <div v-else-if="approvalAlerts.length > 0">
          <p class="my-4 font-bold text-lg flex items-center gap-2">
            <FileText :size="24" />
            Pendentes
          </p>
          <ul class="mt-4 space-y-2">
            <li
              v-for="notification in approvalAlerts"
              :key="notification.id"
              class="rounded-lg border border-zinc-300 bg-white p-3"
            >
              <p class="font-semibold text-sm">{{ notification.title }}</p>
              <p class="text-xs text-zinc-600">
                {{ formatNotificationDate(notification.createdAt) }}
              </p>
            </li>
          </ul>
        </div>

        <div v-else class="mt-4 rounded-lg border border-zinc-300 bg-white p-4">
          <p class="text-sm text-zinc-700 flex items-center gap-2">
            <AlertTriangle :size="16" class="text-amber-600" />
            Sem alertas no momento.
          </p>
        </div> -->

        <div class="my-4 p-0.5 rounded-xl bg-muted/90 overflow-scroll h-[200px]">
          <div v-if="isInvoicesLoading" class="flex items-center justify-center py-8">
            <LoaderCircle :size="48" class="animate-spin" />
          </div>

          <ul v-else-if="recentInvoices.length > 0" class="space-y-2">
            <li
              v-for="invoice in recentInvoices"
              :key="invoice.id"
              class="rounded-lg border border-zinc-300 bg-white p-3 flex items-start justify-between gap-2"
            >
              <div>
                <p class="text-sm font-semibold">#{{ invoice.number }}</p>
                <p class="text-xs text-zinc-600">
                  {{ sanitizeRideDate(invoice.createdAt) }}
                </p>
                <p class="text-sm font-bold mt-1">{{ currencyFormat(invoice.value) }}</p>
              </div>
              <span
                :class="`inline-flex rounded-md px-2 py-1 text-xxs text-white uppercase ${invoiceStatusClass(invoice.status)}`"
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
      <div class="col-span-1 p-6 flex flex-col rounded-xl bg-muted/90 h-full">
        <p class="font-bold text-lg">
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
            class="py-4 flex items-center justify-between gap-3 border-b border-zinc-300 last-of-type:border-b-0"
          >
            <p class="flex-1 text-sm text-left">
              <span class="font-bold">{{ ride.code }}</span>
              <span> | </span>
              {{ ride?.user.name }} |
              {{ sanitizeRideDate(ride.travel.date) }}
            </p>
            <RideStatusFlag :ride-status="ride.status" />

            <Button
              type="button"
              size="icon"
              variant="link"
              @click="navigateTo(`/rides/form/edit/${ride.code || ride.id}`)"
            >
              <ExternalLink :size="16" />
            </Button>
          </li>
        </ul>
        <div v-else class="p-10 flex flex-col items-center justify-center h-full">
          <Inbox class="text-muted-foreground" :size="24" />
          <p class="my-3 text-muted-foreground text-sm">Nenhum atendimento recente</p>
        </div>
        <Button
          v-if="contractRidesList.length > 0"
          type="button"
          class="mt-6 p-6 w-full"
          @click="navigateTo('/rides/list/open')"
        >
          Ver Todos
        </Button>
      </div>
      <div class="p-6 flex flex-col rounded-xl bg-muted/90 h-full min-w-0">
        <p class="mb-6 font-bold text-lg">
          <ChartArea class="mb-2" :size="32" />
          Atendimentos por mês
        </p>
        <DashBarChart v-if="getRideMonthData.length" :data="getRideMonthData" />
        <div v-else class="p-10 flex flex-col items-center justify-center h-full">
          <Inbox class="text-muted-foreground" :size="24" />
          <p class="my-3 text-muted-foreground text-sm">Nenhum atendimento no período</p>
        </div>
      </div>
      <div class="col-span-1 p-6 flex flex-col rounded-xl bg-muted/90 gap-6">
        <p class="font-bold text-lg">
          <Coins class="mb-2" :size="32" />
          Budget
        </p>
        <div v-if="isLoading" class="flex items-center justify-center flex-1">
          <LoaderCircle class="text-zinc-950 animate-spin" :size="48" />
        </div>
        <div v-else class="flex flex-col">
          <div>
            <small class="text-muted-foreground">Budget total / mensal</small>
            <h1 class="text-xl md:text-5xl font-bold">
              {{ currencyFormat(contract?.mainBudget) }}
            </h1>
          </div>
          <div>
            <small class="text-muted-foreground">Budget disponível (não alocado)</small>
            <h1
              class="text-2xl font-bold"
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
          <div class="border border-zinc-950 rounded-lg bg-muted/80 p-4 mt-4 pt-1">
            <small class="mb-6 font-bold"> {{ branch.fantasyName }}</small>
            <div class="flex flex-col md:flex-row justify-between gap-2">
              <div>
                <small class="text-muted-foreground">Alocado</small>
                <h1 class="text-xl font-bold">{{ currencyFormat(branch.budget) }}</h1>
              </div>
              <div>
                <small class="text-muted-foreground">Utilizado</small>
                <h1 class="text-xl font-bold">
                  {{ currencyFormat(branch.usedBudget) }}
                </h1>
              </div>
              <div>
                <small class="text-muted-foreground">Saldo</small>
                <h1
                  class="text-xl font-bold text-amber-600"
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
          class="mt-6 p-6 w-full md:w-fit"
          @click="navigateTo({ path: '/corporative/contracts/edit/', hash: '#budget' })"
        >
          Gerenciar Budget
        </Button>
      </div>
    </div>
  </div>
</template>
