<script setup lang="ts">
import { useContractsStore } from '#imports';
import { useAccountStore } from '#imports';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import FormButtons from '@/components/forms/FormButtons.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import BackLink from '@/components/shared/BackLink.vue';
import ChangeMasterManager from '@/components/shared/ChangeMasterManager.vue';
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import { rolesTypes } from '@/config/roles';
import { toTypedSchema } from '@vee-validate/zod';
import {
  Check,
  Download,
  Edit,
  File,
  FileText,
  LoaderCircle,
  Save,
  Trash,
  User,
  View,
  X,
} from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { currencyFormat, dateFormat } from '~/lib/utils';

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
// Define the Account type to ensure correct typing
type Account = {
  id: string;
  username: string;
  email?: string;
  role?: string;
  status?: string;
  enabled?: boolean;
  createdAt?: string;
  avatar?: {
    url: string;
    name: string;
  };
  contract: {
    restrictions?: Array<string>;
  };
};

const { accounts } = storeToRefs(accountsStore) as { accounts: Ref<Account[]> };

const contractProducts = ref([]);
const contractRemainBudget = ref(0);
const calculatedBudget = ref(0);
const branchBudgetValues = reactive({} as Record<string, any>);
const pendingBranchValues = reactive({} as Record<string, any>);
const editingBranches = reactive({} as Record<string, boolean>);
const isClient = ref(false);

const userRestrictions = [
  {
    id: 'week',
    label: 'Semanal',
  },
  {
    id: 'weekend',
    label: 'Fins de Semana',
  },
  {
    id: 'night',
    label: 'Atendimento Noturno',
  },
  {
    id: 'vacations',
    label: 'Férias',
  },
] as const;

onMounted(() => {
  isClient.value = true;
});

const fetchContractData = async () => {
  await getContractByIdAction(contractId);
  contractProducts.value = contract?.value.products;
};

await fetchContractData();

const initBranchBudgets = () => {
  (contract?.value?.branches || []).forEach((b: any) => {
    // Slider expects an array (single-thumb: [value]) so store as array
    const arr = [parseFloat(b.budget) || 0];
    branchBudgetValues[b.id] = arr;
    pendingBranchValues[b.id] = [...arr];
    editingBranches[b.id] = false;
  });
  contractRemainBudget.value = parseFloat(contract?.value?.mainBudget) || 0;
  const sum = Object.values(branchBudgetValues).reduce((s, v) => {
    const val = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
    return s + (isNaN(val) ? 0 : val);
  }, 0);
  contractRemainBudget.value -= sum;
};

initBranchBudgets();

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

// commit a branch budget change (save)
const commitBranchBudget = (branchId: any) => {
  const v = pendingBranchValues[branchId];
  const numeric = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
  // commit to branchBudgetValues (array)
  branchBudgetValues[branchId] = [numeric];

  // update contract model
  const idx = contract?.value?.branches?.findIndex((b: any) => b.id === branchId);
  if (
    idx !== -1 &&
    idx !== undefined &&
    contract &&
    contract.value &&
    contract.value.branches &&
    contract.value.branches[idx]
  ) {
    contract.value.branches[idx].budget = String(numeric);
  }

  // recompute remaining budget from committed values
  const sum = Object.values(branchBudgetValues).reduce((s, v) => {
    const val = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
    return s + (isNaN(val) ? 0 : val);
  }, 0);
  contractRemainBudget.value = (parseFloat(contract?.value?.mainBudget) || 0) - sum;
  calculatedBudget.value = contractRemainBudget.value;

  editingBranches[branchId] = false;
};

// cancel editing (revert pending values)
const cancelEdit = (branchId: any) => {
  pendingBranchValues[branchId] = branchBudgetValues[branchId]
    ? [...branchBudgetValues[branchId]]
    : [
        parseFloat(
          contract?.value?.branches?.find((b: any) => b.id === branchId)?.budget,
        ) || 0,
      ];
  editingBranches[branchId] = false;
};

// while editing, update pending and compute preview remaining
const calculatePreviewRest = (branchId: any, value: any) => {
  const numeric = Array.isArray(value) ? Number(value[0] || 0) : Number(value || 0);
  pendingBranchValues[branchId] = [numeric];

  // compute sum of committed values except current branch, plus this pending
  const sum = Object.keys(branchBudgetValues).reduce((s, key) => {
    if (key === branchId) return s;
    const v = branchBudgetValues[key];
    const val = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
    return s + (isNaN(val) ? 0 : val);
  }, 0);
  const total = sum + numeric;
  contractRemainBudget.value = (parseFloat(contract?.value?.mainBudget) || 0) - total;
  calculatedBudget.value = contractRemainBudget.value;
};

const sliderMax = (branchId: any, branch?: any) => {
  const main = parseFloat(contract?.value?.mainBudget) || 0;
  // sum committed values for other branches (exclude current branch)
  const sumOthers = Object.keys(branchBudgetValues).reduce((s, key) => {
    if (key === branchId) return s;
    const v = branchBudgetValues[key];
    const val = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
    return s + (isNaN(val) ? 0 : val);
  }, 0);
  // maximum absolute value this branch can take is mainBudget - sumOthers
  const max = Math.max(0, main - sumOthers);
  return max;
};

const handleAllowProduct = ({ branch, product }: any) => {
  const currentBranch = contract?.value.branches.findIndex(
    (item: any) => item.id === branch.id,
  );
  const findAllowedProduct = contract?.value.branches[
    currentBranch
  ].allowedProducts.findIndex((item: any) => item.id === product.id);

  if (findAllowedProduct === -1) {
    contract?.value.branches[currentBranch].allowedProducts.push({
      id: product.id,
      name: product.name,
      code: product.code,
    });
  } else {
    contract?.value.branches[currentBranch].allowedProducts.splice(findAllowedProduct, 1);
  }
};

const userNameInitials = (name: string) => {
  const splited = name.split(' ').splice(0, 2);
  return splited.map((word: string) => word[0]).join('');
};

// Toggle restriction for a user account
function toggleRestriction(account: Account, restrictionId: string) {
  if (!account.contract.restrictions) {
    account.contract.restrictions = [];
  }
  const idx = account.contract.restrictions.indexOf(restrictionId);
  if (idx === -1) {
    account.contract.restrictions.push(restrictionId);
  } else {
    account.contract.restrictions.splice(idx, 1);
  }
}

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
        <Button>
          <Download />
          Baixar Contrato PDF
        </Button>
        <Button>
          <File />
          Termos do Contrato
        </Button>
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
          <Accordion type="single" class="w-full flex flex-col gap-6" collapsible>
            <AccordionItem value="0">
              <AccordionTrigger class="px-6 hover:no-underline">
                <h2 class="text-2xl font-bold">1. Dados da Matriz</h2>
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
                    Selecione quais filiais poderão solicitar atendimento utilizando este
                    produto.
                  </h5>
                  <section class="flex flex-row gap-6">
                    <ul class="my-6 space-y-4">
                      <li
                        v-for="branch in contract.branches"
                        class="flex items-center gap-3"
                      >
                        <Checkbox
                          @update:checked="handleAllowProduct({ branch, product })"
                          :checked="
                            !!branch.allowedProducts.find(
                              (item: any) => item.id === product.id,
                            )
                          "
                          class="data-[state=checked]:border-zinc-950 data-[state=checked]:bg-zinc-950 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 w-6 h-6"
                        />
                        <p>
                          <span class="font-bold"> {{ branch.branchCode }} - </span>
                          {{ branch.fantasyName }}
                        </p>
                      </li>
                    </ul>
                  </section>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card class="bg-zinc-200">
          <CardHeader>
            <h2 class="text-2xl font-bold">4. Budget</h2>
            <h5 class="text-muted-foreground">
              Aqui você gerencia o budget mensal do contrato e a distribuição por filial.
            </h5>
          </CardHeader>
          <CardContent>
            <div class="flex gap-4">
              <FormField v-slot="{ componentField }" name="mainBudget">
                <FormItem class="max-w-[250px]">
                  <FormControl>
                    <CurrencyInput
                      :componentField="componentField"
                      label="Budget do Contrato"
                      :styles="'text-2xl p-6 pl-10 font-bold'"
                    />
                  </FormControl>
                  <FormMessage class="absolute" />
                </FormItem>
              </FormField>

              <div class="space-y-2">
                <Label class="text-sm font-medium">Budget Não Alocado</Label>
                <h2
                  class="mt-2 p-2 text-2xl font-bold text-green-600"
                  :class="contractRemainBudget === 0 && 'text-red-600'"
                >
                  {{ currencyFormat(contractRemainBudget.toString()) }}
                </h2>
              </div>
            </div>

            <ul class="mt-6 space-y-6">
              <li
                v-for="branch in contract.branches"
                :key="branch.id"
                class="p-4 flex items-center justify-between border border-zinc-950 rounded-md bg-white"
              >
                <p>
                  <span class="font-bold"> {{ branch.branchCode }} - </span>
                  {{ branch.fantasyName }}
                </p>
                <div class="flex items-center gap-3 w-1/2">
                  <div class="flex-1">
                    <template v-if="isClient && editingBranches[branch.id]">
                      <Slider
                        :defaultValue="pendingBranchValues[branch.id]"
                        v-model="pendingBranchValues[branch.id]"
                        @update:model-value="
                          (value: number[] | undefined) =>
                            calculatePreviewRest(branch.id, value)
                        "
                        :max="sliderMax(branch.id, branch)"
                        :min="0"
                        :step="1000"
                        class="w-full"
                      />
                    </template>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <h1 class="text-2xl font-bold">
                    {{
                      currencyFormat(
                        (editingBranches[branch.id]
                          ? Array.isArray(pendingBranchValues[branch.id])
                            ? pendingBranchValues[branch.id][0]
                            : pendingBranchValues[branch.id]
                          : Array.isArray(branchBudgetValues[branch.id])
                            ? branchBudgetValues[branch.id][0]
                            : branchBudgetValues[branch.id]) || branch.budget,
                      )
                    }}
                  </h1>
                  <Button
                    v-if="!editingBranches[branch.id]"
                    @click.prevent="
                      ((editingBranches[branch.id] = true),
                      (pendingBranchValues[branch.id] = branchBudgetValues[branch.id]
                        ? [...branchBudgetValues[branch.id]]
                        : [parseFloat(branch.budget) || 0]))
                    "
                  >
                    <Edit />
                    Alterar
                  </Button>
                  <template v-else>
                    <Button
                      size="icon"
                      @click.prevent="commitBranchBudget(branch.id)"
                      title="Salvar Budget"
                    >
                      <Save />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click.prevent="cancelEdit(branch.id)"
                      title="Cancelar"
                    >
                      <X />
                    </Button>
                  </template>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card class="bg-zinc-200">
          <CardHeader>
            <h2 class="text-2xl font-bold">5. Usuários ativos</h2>
            <h5 class="text-muted-foreground">
              Aqui você gerencia todos os usuários do contrato e as permissões de cada um.
            </h5>
          </CardHeader>
          <CardContent>
            <ul v-if="accounts && accounts.length > 0" class="flex gap-6 flex-wrap">
              <li
                class="flex flex-col items-start flex-1"
                v-for="account in accounts"
                :key="account?.id"
              >
                <Card class="md:min-w-[250px] w-full">
                  <div class="p-2 flex flex-row items-end justify-end">
                    <Button
                      v-if="
                        account.role === 'master-manager' ||
                        account.role === 'branch-manager' ||
                        account.role === 'admin'
                      "
                      title="Remover usuário"
                      variant="ghost"
                      size="icon"
                      @click.prevent=""
                      class="hover:bg-red-500 hover:text-white rounded-lg"
                    >
                      <Trash />
                    </Button>
                  </div>
                  <CardHeader class="flex items-center">
                    <Avatar class="h-20 w-20 mb-6 border-4 border-zinc-950">
                      <AvatarImage :src="account?.avatar?.url || ''" />
                      <AvatarFallback
                        class="text-3xl font-medium text-muted-foreground/30"
                      >
                        {{ userNameInitials(account?.username as string) }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="flex flex-col items-center">
                      <h2 class="font-bold text-xl">{{ account?.username }}</h2>
                      <small class="text-muted-foreground">
                        {{ account?.email }}
                      </small>
                      <small>{{ rolesTypes[account?.role as string] }} </small>
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
                          {{ dateFormat(account?.createdAt) }}
                        </span>
                      </div>
                      <div
                        class="flex flex-col items-center p-1 border border-zinc-900 rounded-md"
                      >
                        <span class="text-[10px] text-muted-foreground uppercase">
                          Status
                        </span>
                        <span class="font-bold text-sm">
                          {{ account?.status === 'pending' ? 'Pendente' : 'Validado' }}
                        </span>
                      </div>
                      <div
                        class="flex flex-col items-center p-1 border border-zinc-900 rounded-md"
                      >
                        <span class="text-[10px] text-muted-foreground uppercase">
                          Ativo
                        </span>
                        <span class="font-bold text-sm">
                          {{ account?.enabled ? 'Sim' : 'Não' }}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      @click="
                        navigateTo({
                          name: 'corporative-accounts-edit-id',
                          params: {
                            id: account?.id,
                          },
                        })
                      "
                    >
                      <User />
                      Editar Usuário
                    </Button>
                    <Separator />
                    <h3 class="font-bold text-lg">Restrições de Atendimento</h3>
                    <ul class="space-y-3">
                      <li
                        v-for="restriction in userRestrictions"
                        :key="restriction.id"
                        class="flex items-center gap-2"
                      >
                        <Checkbox
                          :checked="
                            account?.contract.restrictions?.includes(restriction.id)
                          "
                          @update:checked="toggleRestriction(account, restriction.id)"
                        />
                        <label :for="restriction.id">{{ restriction.label }}</label>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </li>
            </ul>
            <p v-else class="text-muted-foreground">Nenhum usuário cadastrado.</p>
          </CardContent>
        </Card>
      </section>
      <FormButtons
        :cancel="'/corporative'"
        :loading="false"
        sbm-label="Salvar Contrato"
        cnc-label="Cancelar"
      />
    </form>
  </main>
</template>

<style scoped></style>
