<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import { useAccountStore } from '@/stores/admin/account.store';
import { Edit, FileText, LoaderCircle, User } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { currencyFormat, dateFormat } from '~/lib/utils';
import { useContractsStore } from '~/stores/admin/contracts.store';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: `Backoffice - Visualizar Contrato | Urban Mobi`,
});

const contractStore = useContractsStore();
const { getContractByIdAction } = contractStore;
const { contract, isLoading } = storeToRefs(contractStore);

const accountsStore = useAccountStore();
const { getUsersAccountsAction } = accountsStore;
const { accounts } = storeToRefs(accountsStore);

const contractAccounts = computed((): any => {
  return accounts?.value.filter(
    (account: any) => account.contractId === (route?.params?.id as string),
  );
});

const route = useRoute();
await getContractByIdAction(route?.params?.id as string);
await getUsersAccountsAction();
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
    <section v-if="isLoading" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="p-6 bg-zinc-200">
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados da Empresa</h2>
          <div class="mb-6 md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Logo</p>
              <div
                class="h-[80px] bg-contain bg-no-repeat bg-center"
                :style="{
                  backgroundImage: `url(${contract?.customer?.logo?.url})`,
                }"
              ></div>
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
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <div>
          <h2 class="mb-4 text-2xl font-bold">Dados do Contrato</h2>
          <div class="md:grid md:grid-cols-2 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Filiais</p>
              <p class="mb-4 text-2xl font-bold">
                {{ contract?.branches.length }}
              </p>
              <p
                v-for="branch in contract?.branches"
                :key="branch.id"
                class="mb-4 flex items-center gap-2 text-sm"
              >
                <span
                  class="mr-2 px-2 py-1 uppercase text-white text-center rounded-md text-sm bg-zinc-800"
                >
                  {{ branch.branchCode }}
                </span>
                {{ branch.fantasyName }}
                <Edit
                  :size="16"
                  class="text-zinc-500 cursor-pointer"
                  @click="
                    navigateTo({
                      name: 'admin-branches-edit-id',
                      params: {
                        id: branch.id,
                      },
                    })
                  "
                />
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
              <p class="mb-6 text-sm text-zinc-600">Budget Mensal Total</p>
              <p class="text-2xl font-bold flex flex-col">
                {{ currencyFormat(contract?.mainBudget) }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="mb-2 text-sm text-zinc-600">Condições Comerciais</p>
              <div class="flex items-center justify-between">
                <p class="text-2xl font-bold flex flex-col">
                  {{ contract?.comercialConditions.paymentTerm }}
                  <span class="font-normal text-sm text-zinc-500">Fechamento</span>
                </p>
                <p class="text-2xl font-bold flex flex-col">
                  {{ contract?.comercialConditions.paymentDueDate }} dias
                  <span class="font-normal text-sm text-zinc-500">Faturamento</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Dados do Gestor Master</h2>
          <div class="md:grid md:grid-cols-4 md:gap-6">
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Nome</p>
              <p class="text-xl font-bold">
                {{ contract?.manager?.username }}
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
                {{ contract?.managerInfo?.phone }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Cargo</p>
              <p class="text-xl font-bold">
                {{ contract?.managerInfo?.position }}
              </p>
            </div>
            <div class="p-6 bg-white rounded-md">
              <p class="text-sm text-zinc-600">Departamento</p>
              <p class="text-xl font-bold">
                {{ contract?.managerInfo?.department }}
              </p>
            </div>
          </div>
        </section>
        <Separator class="my-6 border-b border-zinc-300" />
        <section>
          <h2 class="mb-4 text-2xl font-bold">Usuários Cadastrados</h2>
          <div class="p-8 bg-white rounded-md text-center">
            <ul class="flex gap-6 flex-wrap" v-if="contractAccounts.length">
              <li
                class="flex flex-col items-start"
                v-for="account in contractAccounts"
                :key="account?.id"
              >
                <Card class="md:min-w-[250px]">
                  <CardHeader class="flex items-center">
                    <Avatar class="h-20 w-20 mb-6">
                      <AvatarImage src="/images/no-avatar.png" :alt="account.username" />
                      <AvatarFallback>UM</AvatarFallback>
                    </Avatar>
                    <div class="flex flex-col">
                      <h2 class="font-bold text-xl">{{ account.username }}</h2>
                      <small class="text-muted-foreground">
                        {{ account.email }}
                      </small>
                      <small>{{ account.role }} </small>
                    </div>
                  </CardHeader>
                  <CardContent class="flex flex-col justify-start gap-6">
                    <div class="grid grid-cols-3 gap-4">
                      <div
                        class="flex flex-col items-center p-1 border border-zinc-900 rounded-md"
                      >
                        <small class="text-[10px] text-muted-foreground uppercase">
                          Cadastrado
                        </small>
                        <span class="font-bold text-xs">
                          {{ dateFormat(account.createdAt) }}
                        </span>
                      </div>
                      <div
                        class="flex flex-col items-center p-1 border border-zinc-900 rounded-md"
                      >
                        <span class="text-[10px] text-muted-foreground uppercase">
                          Status
                        </span>
                        <span class="font-bold text-sm">
                          {{ account.status === 'pending' ? 'Pendente' : 'Validado' }}
                        </span>
                      </div>
                      <div
                        class="flex flex-col items-center p-1 border border-zinc-900 rounded-md"
                      >
                        <span class="text-[10px] text-muted-foreground uppercase">
                          Ativo
                        </span>
                        <span class="font-bold text-sm">
                          {{ account.enabled ? 'Sim' : 'Não' }}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      @click="
                        navigateTo({
                          name: 'admin-accounts-edit-id',
                          params: {
                            id: account.id,
                          },
                        })
                      "
                    >
                      <User />
                      Editar Usuário
                    </Button>
                  </CardContent>
                </Card>
              </li>
            </ul>
            <p v-else class="text-muted-foreground">Nenhum usuário cadastrado.</p>
          </div>
        </section>
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
