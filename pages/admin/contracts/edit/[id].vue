<script setup lang="ts">
import { useContractsStore } from '@/stores/contracts.store';
import {
  ArrowLeft,
  Edit,
  FileText,
  LoaderCircle,
  Trash,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

definePageMeta({
  layout: 'admin',
});

const store = useContractsStore();
const { getContractByIdAction } = store;
const { contract, isLoading } = storeToRefs(store);

const route = useRoute();

onMounted(async () => {
  await getContractByIdAction(route?.params?.id as string);
});
</script>
<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/contracts/active" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section class="p-6" v-if="isLoading">
      <LoaderCircle class="w-6 h-6 animate-spin" />
    </section>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Editar Contrato
      </h1>
      <div class="flex gap-4">
        <!-- <Button @click="navigateTo('/admin/contracts/edit')">
          <Edit class="w-4 h-4" /> Editar Contrato
        </Button> -->
        <Button variant="destructive" @click="">
          <Trash class="w-4 h-4" /> Excluir Contrato
        </Button>
      </div>
    </section>
    <section class="mt-6">
      <Card class="bg-zinc-200">
        <pre>{{ contract }}</pre>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
