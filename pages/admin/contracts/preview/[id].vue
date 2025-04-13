<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import { Edit, FileText, LoaderCircle, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { dateFormat } from '~/lib/utils';
import { useContractsStore } from '~/stores/admin/contracts.store';

definePageMeta({
  layout: 'admin',
});

const store = useContractsStore();
const { getContractByIdAction } = store;
const { contract, isLoading } = storeToRefs(store);

const route = useRoute();
await getContractByIdAction(route?.params?.id as string);
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Detalhes do Contrato
        <p
          class="px-2 text-white font-bold text-lg uppercase rounded-md"
          :class="`${contract?.enabled ? 'bg-green-600' : 'bg-red-600'}`"
        >
          {{ contract?.enabled ? 'Ativo' : 'Inativo' }}
        </p>
      </h1>
      <Button
        @click="
          navigateTo({
            name: 'admin-contracts-edit-id',
            //@ts-ignore
            params: { id: contract?.id },
          })
        "
      >
        <Edit class="w-4 h-4" />
        Editar Contrato
      </Button>
    </section>
    <section
      v-if="isLoading"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados do Cliente</h2>
          <div class="mb-6 md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Logo</p>
              <img
                :src="contract?.customer?.logo?.url"
                alt=""
                class="w-[100px]"
              />
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">CNPJ</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.document }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-2">
              <p class="text-sm text-zinc-600">Razão Social</p>
              <p class="text-xl font-bold">{{ contract?.customerName }}</p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-3">
              <p class="text-sm text-zinc-600">Nome Fantasia</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.fantasyName }}
              </p>
            </div>

            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Telefone</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.phone }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Ramal</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.phoneExtension }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Data Cadastro</p>
              <p class="text-xl font-bold">
                {{ dateFormat(contract?.customer?.createdAt) }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-2">
              <p class="text-sm text-zinc-600">Site</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.website }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-4">
              <p class="text-sm text-zinc-600">Endereço</p>
              <p class="text-xl font-bold">
                {{ contract?.customer?.address?.streetName }},
                {{ contract?.customer?.address?.streetNumber }} -
                {{ contract?.customer?.address?.complement }} -
                {{ contract?.customer?.address?.neighborhood }} -
                {{ contract?.customer?.address?.city }} -
                {{ contract?.customer?.address?.state }} -
                {{ contract?.customer?.address?.zipcode }}
              </p>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados do Contrato</h2>
          <div class="md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Filiais</p>
              <p class="text-2xl font-bold">
                {{ contract?.customerBranches.length }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Produtos Ativos</p>
              <p class="mb-4 text-2xl font-bold">
                {{ contract?.products.length }}
              </p>
              <p
                v-for="product in contract?.products"
                :key="product.id"
                class="mb-4 text-sm"
              >
                <span
                  class="mr-2 px-2 py-1 uppercase text-white text-center rounded-md text-sm"
                  :class="`${product.type === 'contract' ? 'bg-zinc-800' : product.type === 'free-km' ? 'bg-orange-400' : 'bg-purple-400'}`"
                  >{{ product.code }}</span
                >{{ product.name }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Usuários Cadastrados</p>
              <p class="text-2xl font-bold">
                {{ contract?.customerUsers.length }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="mb-2 text-sm text-zinc-600">Condições Comerciais</p>
              <div class="flex items-center justify-between">
                <p class="text-2xl font-bold flex flex-col">
                  {{ contract?.comercialConditions.paymentTerm }}
                  <span class="font-normal text-sm text-zinc-500"
                    >Fechamento</span
                  >
                </p>
                <p class="text-2xl font-bold flex flex-col">
                  {{ contract?.comercialConditions.paymentDueDate }} dias
                  <span class="font-normal text-sm text-zinc-500"
                    >Faturamento</span
                  >
                </p>
              </div>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados do Gestor Master</h2>
          <div class="md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ contract?.manager?.name }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md col-span-2">
              <p class="text-sm text-zinc-600">E-mail</p>
              <p class="text-xl font-bold">
                {{ contract?.manager?.email }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Celular</p>
              <p class="text-xl font-bold">
                {{ contract?.manager?.phone }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Cargo</p>
              <p class="text-xl font-bold">
                {{ contract?.manager?.position }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Departamento</p>
              <p class="text-xl font-bold">
                {{ contract?.manager?.department }}
              </p>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <div>
          <h2 class="mb-4 text-2xl font-bold">Informações Adicionais</h2>
          <div class="p-6 bg-white rounded-md">
            {{ contract.additionalInfo }}
          </div>
        </div>
        <!-- <pre>{{ contract }}</pre> -->
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
