<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useCommissionsStore } from '@/stores/commissions.store';
import { useFeeStore } from '@/stores/fees.store';
import { useRidesStore } from '@/stores/rides.store';
import {
  BanknoteIcon,
  CalendarDays,
  ChartArea,
  ExternalLink,
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

const feeStore = useFeeStore();
const { getFeeByTypeAction } = feeStore;
const { fee } = storeToRefs(feeStore);

const { data } = useAuth();

const allRides = ref<any>([]);
const accumulatedCommissions = ref<any>(0);
const loadingRides = ref<boolean>(false);
const totalRevenue = ref<string>('');

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});

onMounted(async () => {
  loadingRides.value = true;
  try {
    await Promise.allSettled([
      getCommissionsAction(),
      getRidesAction(),
      getFeeByTypeAction('driver_fee'),
    ]);
    allRides.value = (rides?.value || []).slice(-4).reverse();
  } finally {
    loadingRides.value = false;
  }
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
    const ammount = curr.billing.ammount !== 'NaN' ? parseFloat(curr.billing.ammount) : 0;
    return acc + ammount;
  }, 0);

  return total.toString();
});

const calculateOpenRidePrices = computed(() => {
  const filteredRides = rides?.value.filter(
    (ride: any) => ride.status !== 'completed' && ride.status !== 'cancelled',
  );
  const total = filteredRides.reduce((acc: any, curr: any) => {
    const ammount = curr.billing.ammount !== 'NaN' ? parseFloat(curr.billing.ammount) : 0;
    return acc + ammount;
  }, 0);

  return total.toString();
});
const calculateFinishedRideAmmount = computed(() => {
  const filteredRides = rides?.value.filter((ride: any) => ride.status === 'completed');
  const total = filteredRides?.reduce((acc: any, curr: any) => {
    const ammount = curr.billing.ammount !== 'NaN' ? parseFloat(curr.billing.ammount) : 0;
    return acc + ammount;
  }, 0);

  const totalCommissions = (total * Number(fee.value.value)) / 100;
  const totalNetRevenue = total - totalCommissions;
  totalRevenue.value = totalNetRevenue.toString();

  return total.toString();
});

const calculateCancelledRideAmmount = computed(() => {
  const filteredRides = rides?.value.filter((ride: any) => ride.status === 'cancelled');
  const total = filteredRides?.reduce((acc: any, curr: any) => {
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
  <!-- <div class="p-6">
    <div class="flex gap-6 items-center"></div>
    <h1 class="text-2xl font-bold">Dashboard Backoffice</h1>
  </div> -->
  <div class="flex flex-1 flex-col gap-4 p-6 pt-0">
    <!-- <div
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
    </div> -->
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="col-span-3 p-6 flex flex-col rounded-xl">
        <div class="flex items-center gap-2 mb-6">
          <Receipt :size="32" />
          <p class="font-bold text-lg">Faturamento - Totais</p>
        </div>

        <div>
          <div
            v-if="calculateOpenRidePrices !== ''"
            class="flex flex-col md:grid md:grid-cols-3 gap-6"
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
      <div class="p-6 col-span-2 rounded-xl bg-muted/90 h-full">
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
                  @click="navigateTo(`/rides/form/edit/${ride.code || ride.id}`)"
                >
                  <ExternalLink :size="16" />
                </Button>
              </p>
              <small>
                {{ ride?.user.name }} -
                {{ sanitizeRideDate(ride.travel.date) }}
              </small>
              <small> {{ ride?.driver.name }}</small>
              <RideStatusFlag :ride-status="ride.status" />
            </li>
          </ul>
          <Button
            type="button"
            class="mt-6 p-6 w-full"
            @click="navigateTo('/rides/list/open')"
          >
            Ver Todos
          </Button>
        </div>
      </div>
      <div class="p-6 rounded-xl bg-muted/90 min-w-0">
        <p class="mb-6 font-bold text-lg">
          <ChartArea class="mb-2" :size="32" />
          Atendimentos por mês
        </p>
        <DashBarChart :data="getRideMonthData" />
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
      <!-- <div class="p-6 flex flex-col rounded-xl bg-muted/90">
        <p class="mb-6 font-bold text-lg">
          <FileText class="mb-2" :size="32" />
          Contratos Ativos
        </p>
      </div> -->
    </div>
  </div>
</template>
