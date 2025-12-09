<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useCommissionsStore } from '@/stores/commissions.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  BanknoteIcon,
  CalendarDays,
  CalendarPlus,
  ChartArea,
  ExternalLink,
  FileText,
  LoaderCircle,
  Receipt,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat, sanitizeRideDate } from '~/lib/utils';

const ridesStore = useRidesStore();
const { getRidesAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const commissionsStore = useCommissionsStore();
const { getCommissionsAction } = commissionsStore;
const { commissions } = storeToRefs(commissionsStore);

const { data } = useAuth();

const allRides = ref<any>([]);
const accumulatedCommissions = ref<any>(0);
const loadingRides = ref<boolean>(false);

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});

onMounted(async () => {
  await getCommissionsAction();
  await getRidesAction();
  loadingRides.value = true;
  if (rides?.value.length >= 3) {
    allRides.value = rides?.value.slice(-4).reverse();
    loadingRides.value = false;
  }
});

const getRideMonthData = computed(() => {
  const months = rides?.value.map((ride: any) => {
    return new Date(ride.travel.date).toLocaleString('pt-BR', { month: 'long' });
  });

  const result = Object.entries(
    months.reduce((acc: any, str: any) => {
      acc[str] = (acc[str] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, total]) => ({ name, total }));

  console.log(result);

  return result;
});

const calculateRidePrices = computed(() => {
  const total = rides?.value.reduce((acc: any, curr: any) => {
    const ammount = curr.billing.ammount !== 'NaN' ? parseFloat(curr.billing.ammount) : 0;
    return acc + ammount;
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
  <div class="p-6">
    <div class="flex gap-6 items-center"></div>
    <h1 class="text-2xl font-bold">Dashboard Backoffice</h1>
  </div>
  <div class="flex flex-1 flex-col gap-4 p-6 pt-0">
    <div
      class="h-[240px] rounded-xl bg-[url('/images/dashboard_banner_background.jpg')] bg-no-repeat bg-cover bg-center"
    >
      <div class="p-10 flex items-center justify-between h-full">
        <div class="flex flex-col gap-2">
          <h2 class="text-white">Olá, {{ userName }}</h2>
          <h1 class="font-bold text-white text-2xl">Seja bem vindo a Urban Mobi!</h1>
        </div>
        <Button
          type="button"
          class="p-6 bg-um-primary hover:bg-um-primary/80 text-black uppercase font-bold shadow-lg"
          @click="navigateTo('/admin/rides/new')"
        >
          <CalendarPlus :size="18" />
          Gerar Atendimento
        </Button>
      </div>
    </div>
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="p-6 rounded-xl bg-muted/90 h-full">
        <p class="font-bold text-lg">
          <CalendarDays class="mb-2" :size="32" />
          Atendimentos recentes
        </p>
        <div v-if="loadingRides" class="h-full flex items-center justify-center">
          <LoaderCircle class="animate-spin" :size="48" />
        </div>
        <div v-else>
          <ul class="mt-6">
            <li
              v-for="(ride, index) in allRides"
              :key="index"
              class="py-4 flex items-center justify-between gap-3 border-b border-zinc-300 last-of-type:border-b-0"
            >
              <p class="text-sm font-bold flex items-center">
                {{ ride.code }}
                <Button
                  type="button"
                  size="icon"
                  variant="link"
                  @click="navigateTo(`/personal/rides/preview/${ride.id}`)"
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
          <Button
            type="button"
            class="mt-6 p-6 w-full"
            @click="navigateTo('/admin/rides/open')"
          >
            Ver Todos
          </Button>
        </div>
      </div>
      <div class="p-6 rounded-xl bg-muted/90">
        <p class="mb-6 font-bold text-lg">
          <ChartArea class="mb-2" :size="32" />
          Atendimentos por mês
        </p>
        <DashBarChart :data="getRideMonthData" />
      </div>
      <div class="p-6 flex flex-col rounded-xl bg-muted/90">
        <p class="mb-6 font-bold text-lg">
          <Receipt class="mb-2" :size="32" />
          Faturado Total - Atendimentos
        </p>

        <div class="flex-grow flex items-center justify-center">
          <h1 v-if="calculateRidePrices !== ''" class="text-6xl font-bold">
            {{ currencyFormat(calculateRidePrices) }}
          </h1>
          <p v-else class="text-muted-foreground">Não há dados no momento.</p>
        </div>
      </div>
      <div class="p-6 flex flex-col rounded-xl bg-muted/90">
        <p class="mb-6 font-bold text-lg">
          <BanknoteIcon class="mb-2" :size="32" />
          Repasse Motoristas
        </p>
        <ul class="p-4 space-y-4 overflow-y-scroll max-h-[300px]">
          <li
            v-for="commission in commissions"
            class="flex items-center gap-2 justify-between"
          >
            <small>{{ commission.driver.name }}</small>
            <small class="font-bold">{{ currencyFormat(commission.ammount) }}</small>
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
          class="mt-6 p-6 w-full"
          @click="navigateTo('/admin/finances/commissions')"
        >
          Ver Todos
        </Button>
      </div>
      <div class="p-6 flex flex-col rounded-xl bg-muted/90">
        <p class="mb-6 font-bold text-lg">
          <FileText class="mb-2" :size="32" />
          Contratos Ativos
        </p>
      </div>
    </div>
    <!-- <div class="min-h-[100vh] flex-1 rounded-xl bg-zinc-200 md:min-h-min" /> -->
  </div>
</template>
