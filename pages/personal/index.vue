<script setup lang="ts">
import DashBarChart from '@/components/shared/DashBarChart.vue';
import RideStatusFlag from '@/components/shared/RideStatusFlag.vue';
import { useRidesStore } from '@/stores/rides.store';
import {
  CalendarDays,
  CalendarPlus,
  ChartArea,
  ExternalLink,
  Receipt,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

const ridesStore = useRidesStore();
const { getUserRidesAction } = ridesStore;
const { rides } = storeToRefs(ridesStore);

const { data } = useAuth();

const userRides = ref<any>([]);

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

onMounted(async () => {
  //@ts-expect-error
  await getUserRidesAction(data?.value?.user?.id as string);
  if (rides?.value.length >= 3) {
    userRides.value = rides?.value.slice(-3).reverse();
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

  return result;
});

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});
</script>

<template>
  <div class="p-6">
    <div class="flex gap-6 items-center"></div>
    <h1 class="text-2xl font-bold">Meu Dashboard</h1>
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
          @click="navigateTo('/personal/rides/new')"
        >
          <CalendarPlus :size="18" />
          Solicitar Atendimento
        </Button>
      </div>
    </div>
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="p-6 rounded-xl bg-muted/90 h-full">
        <p class="font-bold text-lg">
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
              {{ new Date(ride.travel.date as string).toLocaleDateString('pt-BR') }}
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
      <div class="p-6 rounded-xl bg-muted/90">
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
