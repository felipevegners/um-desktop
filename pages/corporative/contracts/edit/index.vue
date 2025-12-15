<script setup lang="ts">
import { useContractsStore } from '#imports';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import BackLink from '@/components/shared/BackLink.vue';
import ChangeMasterManager from '@/components/shared/ChangeMasterManager.vue';
import { toTypedSchema } from '@vee-validate/zod';
import { FileText, LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { currencyFormat, generatePassword } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const { data } = useAuth();
//@ts-expect-error
const { contractId } = data?.value?.user?.contract;

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract, isLoading } = storeToRefs(contractsStore);

const accountsStore = useAccountStore();
const { getUsersAccountsByContractIdAction } = accountsStore;
const { accounts } = storeToRefs(accountsStore);

const contractProducts = ref([]);

const fetchContractData = async () => {
  await getContractByIdAction(contractId);
  contractProducts.value = contract?.value.products;
};

await fetchContractData();

const fetchContractUsersData = async () => {
  await getUsersAccountsByContractIdAction(contractId);
  // console.log(accounts.value);
};

await fetchContractUsersData();

const customerLogoImage = reactive({
  name: contract?.value.customer?.logo?.name || '',
  url: contract?.value.customer?.logo?.url || '',
});

const handleInactivateProduct = (product: any) => {
  console.log('--->', contract?.value.products);
};
const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Insira o nome').max(100),
    document: z.string().min(2).max(50),
    fantasyName: z.string().min(2).max(50),
    zipcode: z.string().min(1).max(9),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    phone: z.string().min(2).max(16),
    phoneExtension: z.string().min(0).max(6).optional(),
    website: z.string().min(2).max(50),
    managerName: z.string().min(1).max(100).optional(),
    managerId: z.string().min(1).max(100).optional(),
    managerPhone: z.string().min(2).max(16).optional(),
    managerPosition: z.string().min(1).max(50).optional(),
    managerDepartment: z.string().min(1).max(50).optional(),
    managerEmail: z.string().email().min(1).max(100),
    mainBudget: z.any().optional(),
    paymentTerm: z.string().min(1).max(10),
    paymentDueDate: z.number().min(0),
    additionalInfo: z.any().optional(),
    status: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: schema,
  keepValuesOnUnmount: true,
  initialValues: {
    document: contract?.value?.customer?.document,
    name: contract?.value?.customer?.name,
    fantasyName: contract?.value?.customer?.fantasyName,
    zipcode: contract?.value?.customer?.address?.zipcode,
    streetName: contract?.value?.customer?.address?.streetName,
    streetNumber: contract?.value?.customer?.address?.streetNumber,
    complement: contract?.value?.customer?.address?.complement,
    neighborhood: contract?.value?.customer?.address?.neighborhood,
    city: contract?.value?.customer?.address?.city,
    state: contract?.value?.customer?.address?.state,
    phone: contract?.value?.customer?.phone,
    phoneExtension: contract?.value?.customer?.phoneExtension,
    website: contract?.value?.customer?.website,
    managerId: contract?.value.manager.id,
    managerName: contract?.value?.managerName,
    managerPhone: contract?.value?.manager?.phone,
    managerPosition: contract?.value?.manager?.position,
    managerDepartment: contract?.value?.manager?.department,
    managerEmail: contract?.value?.manager?.email,
    mainBudget: Number(contract?.value.mainBudget) * 100,
    paymentTerm: contract?.value?.comercialConditions?.paymentTerm,
    paymentDueDate: contract?.value?.comercialConditions?.paymentDueDate,
    additionalInfo: contract?.value?.additionalInfo,
    status: contract?.value?.status,
  },
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Gerenciar Contrato - {{ contract.customerName }}
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Contrato </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="contract.status"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativo </Label>
          </div>
        </div>
      </div>
    </section>
    <section v-if="isLoading" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="animate-spin" :size="40" />
    </section>
    <form v-else @submit.prevent="" @keydown.enter.prevent="true">
      <section class="space-y-6">
        <Card class="bg-zinc-200">
          <CardHeader>
            <h2 class="text-2xl font-bold">1. Dados da Matriz</h2>
          </CardHeader>
          <CardContent>
            <div class="mb-6 flex flex-col gap-4">
              <p class="font-bold">Logo</p>
              <AvatarEdit
                v-model="customerLogoImage"
                uploadUrl="customerLogo"
                type="customer-logo"
              />
            </div>
            <CompanyForm :loading="isLoading" :isEditing="true" :form="form" />
          </CardContent>
        </Card>
        <Card class="bg-zinc-200">
          <CardHeader>
            <h2 class="text-2xl font-bold">2. Dados do Gestor Master</h2>
            <h5 class="text-muted-foreground">
              O gestor master é responsável pelo contrato e também pela gestão das filiais
              e seus usuários.
            </h5>
          </CardHeader>
          <CardContent>
            <ChangeMasterManager
              :form="form"
              :editMode="true"
              :managerData="contract?.manager"
              :loading="isLoading"
              :usersList="accounts"
            />
          </CardContent>
        </Card>
        <Card class="bg-zinc-200">
          <CardHeader>
            <h2 class="text-2xl font-bold">3. Produtos contratados</h2>
            <h5 class="text-muted-foreground">
              Aqui você gerencia os produtos contratados e a disponibilidade por filial.
            </h5>
          </CardHeader>
          <CardContent>
            <ul class="space-y-6">
              <li
                v-for="product in contract.products"
                class="flex-1 p-4 rounded-md border border-zinc-950 bg-white"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-[80px] h-[80px] rounded-md bg-zinc-200 bg-contain bg-no-repeat bg-center relative flex items-center justify-center"
                      :style="{ backgroundImage: `url(${product.image?.url})` }"
                    />
                    <div class="flex items-center justify-between gap-2">
                      <span class="uppercase font-bold"> {{ product.code }}</span>
                      <SharedProductTag :label="product.name" :type="product.name" />
                    </div>
                  </div>

                  <div>
                    <Label class="text-sm font-bold">
                      {{ product.enabled ? 'Desativar' : 'Ativar' }} Produto
                    </Label>
                    <div class="mt-2 flex items-center gap-3">
                      <Label class="text-sm text-zinc-500"> Inativo </Label>
                      <Switch
                        v-model:checked="product.enabled"
                        @update:checked="handleInactivateProduct(product)"
                        class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                      />
                      <Label class="text-sm text-zinc-500"> Ativo </Label>
                    </div>
                  </div>
                </div>
                <div class="my-3 px-4 py-2 border border-zinc-950 rounded-md">
                  <h3 class="my-2 font-bold">Valores negociados no contrato</h3>
                  <section class="flex flex-row gap-6">
                    <div v-if="product.type === 'contract'">
                      <small class="text-center text-muted-foreground">Km Incluso</small>
                      <p class="font-bold text-center">{{ product.includedKms }}</p>
                    </div>
                    <div v-if="product.type === 'contract'">
                      <small class="text-center text-muted-foreground"
                        >Horas Inclusas</small
                      >
                      <p class="font-bold text-center">{{ product.includedHours }}</p>
                    </div>
                    <div>
                      <small class="text-center text-muted-foreground">Valor base</small>
                      <p class="font-bold text-center">
                        {{ currencyFormat(product.basePrice) }}
                      </p>
                    </div>
                    <div>
                      <small class="text-center text-muted-foreground">Valor Km</small>
                      <p class="font-bold text-center">
                        {{ currencyFormat(product.kmPrice) }}
                      </p>
                    </div>
                    <div>
                      <small class="text-center text-muted-foreground"
                        >Valor Minuto</small
                      >
                      <p class="font-bold text-center">
                        {{ currencyFormat(product.minutePrice) }}
                      </p>
                    </div>
                    <div>
                      <small class="text-center text-muted-foreground">Capacidade</small>
                      <p class="font-bold text-center">{{ product.capacity }}</p>
                    </div>
                  </section>
                </div>
                <div class="my-3 px-4 py-2 border border-zinc-950 rounded-md">
                  <h3 class="mt-2 font-bold">Disponibilidade por Filial</h3>
                  <h5 class="text-muted-foreground">
                    Selecione quais filiais poderão solicitar atendimento por tipo de
                    produto.
                  </h5>
                  <section class="flex flex-row gap-6">
                    <ul class="my-6 space-y-4">
                      <li
                        v-for="branch in contract.branches"
                        class="flex items-center gap-3"
                      >
                        <Checkbox
                          @update:checked=""
                          class="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 w-6 h-6"
                        />
                        <p>
                          <span class="font-bold"> {{ branch.branchCode }} - </span>
                          {{ branch.fantasyName }} - {{ branch.id }}
                        </p>
                      </li>
                    </ul>
                    <!-- <pre>{{ contract.branches }}</pre> -->
                  </section>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </form>
  </main>
</template>

<style scoped></style>
