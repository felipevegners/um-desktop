<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { Edit, FileText, LoaderCircle } from 'lucide-vue-next';
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
        Detalhes da Filial
        <!-- <p
          class="px-2 text-white font-bold text-lg uppercase rounded-md"
          :class="`${contract?.enabled ? 'bg-green-600' : 'bg-red-600'}`"
        >
          {{ contract?.enabled ? 'Ativo' : 'Inativo' }}
        </p> -->
      </h1>
      <Button
        @click="
          navigateTo({
            name: 'admin-branches-edit-id',
            //@ts-ignore
            params: { id: branch?.id },
          })
        "
      >
        <Edit class="w-4 h-4" />
        Editar Filial
      </Button>
    </section>
    <section
      v-if="isLoadingData"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados da Filial</h2>
          <div class="mb-6 md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Código</p>
              <p class="text-xl font-bold">
                {{ branch.branchCode }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">CNPJ</p>
              <p class="text-xl font-bold">
                {{ branch.document }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-2">
              <p class="text-sm text-zinc-600">Razão Social</p>
              <p class="text-xl font-bold">{{ branch?.name }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-3">
              <p class="text-sm text-zinc-600">Nome Fantasia</p>
              <p class="text-xl font-bold">
                {{ branch?.fantasyName }}
              </p>
            </div>

            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Telefone</p>
              <p class="text-xl font-bold">
                {{ branch?.phone }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Ramal</p>
              <p class="text-xl font-bold">
                {{ branch?.phoneExtension }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Data Cadastro</p>
              <p class="text-xl font-bold">
                {{ dateFormat(branch?.createdAt) }}
              </p>
            </div>
            <!-- <div class="p-6 bg-white rounded-md col-span-4">
              <p class="text-sm text-zinc-600">Endereço</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.address?.streetName }},
                {{ contract?.customer?.address?.streetNumber }}
                {{
                  contract?.customer?.address?.complement !== '-'
                    ? contract?.customer?.address?.complement
                    : ''
                }}
              </p>
              <p>
                {{ contract?.customer?.address?.neighborhood }},
                {{ contract?.customer?.address?.city }},
                {{ contract?.customer?.address?.state }},
                {{ contract?.customer?.address?.zipcode }}
              </p>
            </div> -->
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
      </Card>
    </section>
    <pre>{{ branch }}</pre>
  </main>
</template>

<style scoped></style>
