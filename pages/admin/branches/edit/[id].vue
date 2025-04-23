<script setup lang="ts">
import BranchForm from '@/components/forms/BranchForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { Edit, FileText, LoaderCircle, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat, dateFormat } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
});

const store = useBranchesStore();
const { getBranchByIdAction, deleteBranchAction } = store;
const { branch, isLoadingData } = storeToRefs(store);

const route = useRoute();
await getBranchByIdAction(route?.params?.id as string);
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Editar Filial
        <!-- <p
          class="px-2 text-white font-bold text-lg uppercase rounded-md"
          :class="`${contract?.enabled ? 'bg-green-600' : 'bg-red-600'}`"
        >
          {{ contract?.enabled ? 'Ativo' : 'Inativo' }}
        </p> -->
      </h1>
      <Button @click="" variant="destructive">
        <Trash class="w-4 h-4" />
        Deletar Filial
      </Button>
    </section>
    <section
      v-if="isLoadingData"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="py-6 bg-zinc-200">
        <BranchForm />
      </Card>
    </section>
    <!-- <pre>{{ branch }}</pre> -->
  </main>
</template>

<style scoped></style>
