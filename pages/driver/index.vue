<script setup lang="ts">
import { useSessionAccess } from '@/composables/auth/useSessionAccess';
import { useDriverStore } from '@/stores/drivers.store';
import { CalendarClock, Info, LayoutDashboard } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const { data } = useAuth();
const { waitForSessionData } = useSessionAccess();

const driverStore = useDriverStore();
const { getDriverByIdAction } = driverStore;
const { driver } = storeToRefs(driverStore);

onBeforeMount(async () => {
  const sessionReady = await waitForSessionData({
    requireUserId: true,
    requireRole: true,
    timeoutMs: 10000,
  });

  if (!sessionReady) return;

  // @ts-ignore
  await getDriverByIdAction(data?.value?.user.id);
});

const userName = computed(() => {
  //@ts-expect-error
  if (data) return data?.value.user?.name;
});
</script>

<template>
  <div class="p-4 md:p-6 min-w-0">
    <div class="flex flex-col gap-6 items-start">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard :size="32" />
        Meu Dashboard
      </h1>
      <div
        class="w-full min-h-[180px] md:h-[240px] rounded-xl bg-[url('/images/dashboard_banner_background.jpg')] bg-no-repeat bg-cover bg-center"
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
            @click="navigateTo('/driver/rides/open')"
          >
            <CalendarClock :size="18" />
            Atendimentos Abertos
          </Button>
        </div>
      </div>
      <div
        v-if="driver?.status === 'pending' || driver?.driverFiles?.cnhCopy?.name === ''"
        class="p-6 bg-amber-300 w-full rounded-md flex items-center justify-between"
      >
        <div>
          <Info :size="24" class="mb-2 text-amber-700" />
          <h3 class="font-bold text-xl text-amber-700">Dados incompletos</h3>
          <p>
            <span class="font-bold">{{ data?.user?.name }}</span
            >, finalize seu cadastro para ativar todos os recursos da plataforma!
          </p>
        </div>
        <Button
          type="button"
          class="p-6 bg-amber-700 hover:bg-amber-600"
          @click="navigateTo('/profile/me')"
        >
          Finalizar Cadastro
        </Button>
      </div>
    </div>
  </div>
  <div class="flex flex-1 flex-col gap-4 p-4 md:p-6 pt-0 min-w-0">
    <div class="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-3">
      <div class="aspect-video rounded-xl bg-muted/90" />
      <div class="aspect-video rounded-xl bg-muted/90" />
      <div class="aspect-video rounded-xl bg-muted/90" />
    </div>
    <div class="min-h-[100vh] flex-1 rounded-xl bg-zinc-200 md:min-h-min" />
  </div>
</template>
