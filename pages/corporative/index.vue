<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import '@/stores/contracts.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  CalendarDays,
  CalendarPlus,
  ChartArea,
  Coins,
  ExternalLink,
  Inbox,
  LoaderCircle,
} from 'lucide-vue-next';
import { currencyFormat, sanitizeRideDate } from '~/lib/utils';

const { data } = useAuth();
//@ts-ignore
const contractId = data.value?.user.contract?.contractId;
//@ts-ignore
const userBranches = data.value?.user.contract?.branches;
//@ts-ignore
const role = data.value?.user?.role;

const ridesStore = useRidesStore();
const { getRidesByContractAction } = ridesStore;
const { rides, loadingData } = storeToRefs(ridesStore);

const contractStore = useContractsStore();
const { getContractByIdAction } = contractStore;
const { contract, isLoading } = storeToRefs(contractStore);

const contractRidesList = ref<any>([]);
const userAllowedBranches = ref<any>([]);

onMounted(async () => {
  await getContractByIdAction(contractId);
  await getRidesByContractAction(contractId);

  if (role === 'master-manager') {
    contractRidesList.value = rides?.value.filter(
      (ride: any) => ride.status !== 'cancelled',
    );
    userAllowedBranches.value = contract?.value.branches;
  } else {
    contractRidesList.value = rides?.value.filter((ride: any) =>
      userBranches.some(
        (filterItem: any) =>
          filterItem.id === ride.billing.paymentData.branch &&
          ride.status !== 'cancelled',
      ),
    );

    const filterUserBranches = contract?.value.branches.filter((item: any) =>
      userBranches.some((filterItem: any) => filterItem.id === item.id),
    );
    userAllowedBranches.value = filterUserBranches;
  }

  if (contractRidesList.value.length >= 4) {
    contractRidesList.value = contractRidesList?.value.slice(-4).reverse();
  }
});

const getRideMonthData = computed(() => {
  const months = contractRidesList?.value.map((ride: any) => {
    return new Date(ride.travel.date).toLocaleString('pt-BR', { month: 'long' });
  });

  if (months.length) {
    const result = Object.entries(
      months.reduce((acc: any, str: any) => {
        acc[str] = (acc[str] || 0) + 1;
        return acc;
      }, {}),
    ).map(([name, total]) => ({ name, total }));

    return result;
  } else {
    return [];
  }
});

const calculateBranchRemainingBudget = (branch: any) => {
  const total = branch.budget - branch.usedBudget;
  return currencyFormat(total.toString());
};

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});

const contractRemainBudget = computed(() => {
  if (contract?.value) {
    return contract?.value.mainBudget - contract.value.usedBudget;
  }
  return 0;
});
</script>

<template>
  <div class="my-6 flex flex-1 flex-col gap-4 p-6 pt-0">
    <div
      class="h-[240px] rounded-xl bg-[url('/images/dashboard_banner_background.jpg')] bg-no-repeat bg-cover bg-center"
    >
      <div class="p-10 flex items-center justify-between h-full">
        <div class="flex flex-col gap-2">
          <h2 class="text-white">Olá, {{ userName }}!</h2>
          <h1 class="font-bold text-white text-2xl">
            Você está no painel de gestão da Urban Mobi!
          </h1>
        </div>
        <Button
          type="button"
          class="p-6 bg-um-primary hover:bg-um-primary/80 text-black uppercase font-bold shadow-lg"
          @click="navigateTo('/corporative/rides/new')"
        >
          <CalendarPlus :size="18" />
          Solicitar Atendimento
        </Button>
      </div>
    </div>

    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="col-span-2 p-6 flex flex-col rounded-xl bg-muted/90 h-full">
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
            <p class="text-sm font-bold flex items-center">
              {{ ride.code }}
              <Button
                type="button"
                size="icon"
                variant="link"
                @click="navigateTo(`/corporative/rides/edit/${ride.id}`)"
              >
                <ExternalLink :size="16" />
              </Button>
            </p>
            <small>
              {{ ride?.user.name }} |
              {{ sanitizeRideDate(ride.travel.date) }}
            </small>
            <RideStatusFlag :ride-status="ride.status" />
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
          @click="navigateTo('/corporative/rides/open')"
        >
          Ver Todos
        </Button>
      </div>
      <div class="p-6 flex flex-col rounded-xl bg-muted/90 h-full">
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
      <div class="col-span-3 p-6 flex flex-col rounded-xl bg-muted/90 gap-6">
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
            <h1 class="text-5xl font-bold">{{ currencyFormat(contract?.mainBudget) }}</h1>
          </div>
          <div>
            <small class="text-muted-foreground">Budget disponível</small>
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
            <div class="flex justify-between gap-2">
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
                <small class="text-muted-foreground">Restante</small>
                <h1 class="text-xl font-bold text-amber-600">
                  {{ calculateBranchRemainingBudget(branch) }}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <Button
          v-if="role === 'master-manager'"
          type="button"
          class="mt-6 p-6 w-fit"
          @click="navigateTo({ path: '/corporative/contracts/edit/', hash: '#budget' })"
        >
          Gerenciar Budget
        </Button>
      </div>
    </div>
  </div>
</template>
