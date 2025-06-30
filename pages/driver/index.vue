<script setup lang="ts">
import { useDriverStore } from '@/stores/drivers.store';
import { Info, LayoutDashboard } from 'lucide-vue-next';

definePageMeta({
  layout: 'admin',
});

const { data } = useAuth();

const driverStore = useDriverStore();
const { createNewDriverAction, getDriverByIdAction } = driverStore;
const { driver } = storeToRefs(driverStore);

// @ts-ignore
await getDriverByIdAction(data?.value?.user.id);
</script>

<template>
  <div class="p-6">
    <div class="flex flex-col gap-6 items-start">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard :size="32" />
        Meu Dashboard
      </h1>
      <div
        v-if="driver.status === 'pending'"
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
          class="bg-amber-700 hover:bg-amber-600"
          @click="navigateTo('driver/account')"
        >
          Finalizar Cadastro
        </Button>
      </div>
    </div>
  </div>
  <div class="flex flex-1 flex-col gap-4 p-6 pt-0">
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <div class="aspect-video rounded-xl bg-muted/90" />
      <div class="aspect-video rounded-xl bg-muted/90" />
      <div class="aspect-video rounded-xl bg-muted/90" />
    </div>
    <div class="min-h-[100vh] flex-1 rounded-xl bg-zinc-200 md:min-h-min" />
  </div>
</template>
