<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import { AlertCircle, Edit, FileText, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat, dateFormat } from '~/lib/utils';
import { useBranchesStore } from '~/stores/branches.store';

definePageMeta({
  layout: 'admin',
});

const store = useBranchesStore();
const { getBranchByIdAction, deleteBranchAction } = store;
const { branch, isLoadingData } = storeToRefs(store);

const route = useRoute();
await getBranchByIdAction(route?.params?.id as string);

const showBranchAreas = computed(() => {
  return (
    branch.value.areas &&
    branch.value.areas.length > 0 &&
    branch.value.areas.some((area: any) => area.areaCode && area.areaName)
  );
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        {{ branch?.branchCode }} - {{ branch?.fantasyName }}
        <p
          class="px-2 text-white font-bold text-lg uppercase rounded-md"
          :class="`${branch?.enabled ? 'bg-green-600' : 'bg-red-600'}`"
        >
          {{ branch?.enabled ? 'Ativa' : 'Inativa' }}
        </p>
      </h1>
      <Button
        @click="
          navigateTo({
            name: 'corporative-branches-edit-id',
            //@ts-ignore
            params: { id: branch?.id },
          })
        "
      >
        <Edit class="w-4 h-4" />
        Editar Filial
      </Button>
    </section>
    <section v-if="isLoadingData" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados da Empresa</h2>
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
                {{ branch?.phoneExtension ? branch?.phoneExtension : '-' }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Data Cadastro</p>
              <p class="text-xl font-bold">
                {{ dateFormat(branch?.createdAt) }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Status do Cadastro</p>
              <p
                class="mt-2 p-2 block rounded-md text-white text-center"
                :class="`${branch.status === 'validated' ? 'bg-green-500' : 'bg-amber-500'}`"
              >
                {{ branch?.status === 'validated' ? 'Validado' : 'Pendente' }}
              </p>
              <small v-if="branch.status === 'pending'" class="text-amber-700">
                *Ainda existem dados não validados
              </small>
            </div>
            <div class="p-6 bg-white rounded-md col-span-4">
              <p class="text-sm text-zinc-600">Endereço</p>
              <div v-if="branch.address?.zipcode">
                <p class="text-xl font-bold">
                  {{ branch?.address?.streetName }},
                  {{ branch?.address?.streetNumber }}
                  {{
                    branch?.address?.complement !== '-' ? branch?.address?.complement : ''
                  }}
                </p>
                <p>
                  {{ branch?.address?.neighborhood }}, {{ branch?.address?.city }},
                  {{ branch?.address?.state }},
                  {{ branch?.address?.zipcode }}
                </p>
              </div>
              <div v-else>
                <p>Não cadastrado</p>
              </div>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <h2 class="mb-4 text-2xl font-bold">Detalhes da Filial</h2>

        <div class="md:grid md:grid-cols-6 md:gap-6">
          <div class="p-6 bg-white rounded-md">
            <p class="text-sm text-zinc-600">Budget Mensal</p>
            <p class="mb-4 text-2xl font-bold">
              {{ branch?.budget ? currencyFormat(branch.budget) : 'Não informado' }}
            </p>
          </div>
          <div class="p-6 bg-white rounded-md">
            <p class="text-sm text-zinc-600">Centros de Custo</p>
            <p
              v-if="showBranchAreas"
              v-for="area in branch?.areas"
              :key="area.areaCode"
              class="my-2"
            >
              <span
                class="mr-2 px-2 py-1 uppercase text-white text-center rounded-md text-sm bg-zinc-900"
              >
                {{ area.areaCode }}
              </span>
              <span>{{ area.areaName }}</span>
            </p>
            <p v-else class="my-6 self-center text-amber-700 text-xs">
              *Nenhum CC cadastrado
            </p>
          </div>
          <div class="p-6 bg-white rounded-md col-span-3">
            <p class="text-sm text-zinc-600">Gestor da Filial</p>
            <p class="text-2xl font-bold">
              {{ branch?.manager?.username }}
            </p>
            <p>
              {{ branch?.manager?.position }} -
              {{ branch?.manager?.department }}
            </p>
            <p>{{ branch?.manager?.email }} - {{ branch?.manager?.phone }}</p>
            <div
              v-if="!branch?.manager.enabled"
              class="mt-4 px-1.5 py-2 flex items-center gap-2 bg-amber-200 rounded-md"
            >
              <AlertCircle :size="20" class="text-amber-700" />
              <small class="text-xs text-amber-700">
                A conta deste usuário está <strong>inativa</strong> e sem acesso ao
                gerenciamento desta Filial. Reative ou altere o usuário gestor da filial.
              </small>
            </div>
          </div>
        </div>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
