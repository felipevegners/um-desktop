<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useRidesStore } from '@/stores/rides.store';
import {
  CalendarDays,
  CalendarPlus,
  ChartArea,
  ExternalLink,
  Receipt,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { sanitizeRideDate } from '~/lib/utils';

const ridesStore = useRidesStore();
const { getUserRidesAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const { data } = useAuth();
const { hasSessionData, status } = useSessionAccess();

const userRides = ref<any>([]);
const hasHydratedDashboard = ref(false);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

watch(
  [status, () => (data.value as any)?.user?.id, () => (data.value as any)?.user?.role],
  async () => {
    if (hasHydratedDashboard.value) return;

    const sessionReady = hasSessionData({
      requireUserId: true,
      requireRole: true,
    });

    if (!sessionReady) return;

    hasHydratedDashboard.value = true;
    //@ts-expect-error
    await getUserRidesAction(data?.value?.user?.id as string);
    if (rides?.value.length >= 3) {
      userRides.value = rides?.value.slice(-3).reverse();
    }
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

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex gap-6 items-center"></div>
    <h1 class="text-2xl font-bold">Meu Dashboard</h1>
  </div>
  <div class="flex flex-1 flex-col gap-4 p-4 md:p-6 pt-0 min-w-0">
    <div
      class="min-h-[180px] md:h-[240px] rounded-xl bg-[url('/images/dashboard_banner_background.jpg')] bg-no-repeat bg-cover bg-center"
    >
      <div
        class="p-6 md:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-full"
      >
        <div class="flex flex-col gap-2">
          <h2 class="text-white">Olá, {{ userName }}</h2>
          <h1 class="font-bold text-white text-xl md:text-2xl">
            Seja bem vindo a Urban Mobi!
          </h1>
        </div>
        <Button
          type="button"
          class="shrink-0 bg-um-primary hover:bg-um-primary/80 text-black uppercase font-bold shadow-lg"
          @click="navigateTo('/personal/rides/new')"
        >
          <CalendarPlus :size="18" />
          Solicitar Atendimento
        </Button>
      </div>
    </div>
    <div class="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3">
      <div class="p-6 rounded-xl bg-muted/90 h-full">
        <p class="font-bold text-lg min-w-0">
          <CalendarDays class="mb-2" :size="32" />
          Atendimentos recentes
        </p>
        <ul class="mt-6">
          <li
            v-for="(ride, index) in userRides"
            :key="index"
            class="py-4 flex items-center justify-between gap-3 border-b border-zinc-300 last-of-type:border-b-0"
          >
            <p class="font-bold flex items-center">
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
            <p>
              {{ sanitizeRideDate(ride.travel.date) }}
              às
              {{ ride.travel.departTime }}
            </p>
            <RideStatusFlag :ride-status="ride.status" />
          </li>
        </ul>
        <Button
          type="button"
          class="mt-6 p-6 w-full"
          @click="navigateTo('/personal/rides/open')"
        >
          Ver Todos
        </Button>
      </div>
      <div class="p-6 rounded-xl bg-muted/90 min-w-0">
        <p class="mb-6 font-bold text-lg">
          <ChartArea class="mb-2" :size="32" />
          Meus Atendimentos por período
        </p>
        <DashBarChart :data="getRideMonthData" />
      </div>
      <div class="p-6 flex flex-col rounded-xl bg-muted/90">
        <p class="mb-6 font-bold text-lg">
          <Receipt class="mb-2" :size="32" />
          Meus Pagamentos
        </p>
        <div class="flex-grow flex items-center justify-center">
          <p class="text-muted-foreground">Não há dados no momento.</p>
        </div>
      </div>
    </div>
    <!-- <div class="min-h-[100vh] flex-1 rounded-xl bg-zinc-200 md:min-h-min" /> -->
  </div>
</template>
