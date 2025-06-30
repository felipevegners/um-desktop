<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import { CalendarDays, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat, dateFormat } from '~/lib/utils';
import { useDriverStore } from '~/stores/drivers.store';

definePageMeta({
  layout: 'admin',
});

const route = useRoute();
const { data } = useAuth();
//@ts-ignore
const { id } = data?.value?.user;

console.log(id);

const driverStore = useDriverStore();
const { getDriverByIdAction } = driverStore;
const { driver } = storeToRefs(driverStore);

await getDriverByIdAction(id);
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <CalendarDays />
        Visualizar atendimento
      </h1>
    </section>
    <section v-if="false" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">{{ driver }} </Card>
    </section>
  </main>
</template>

<style scoped></style>
