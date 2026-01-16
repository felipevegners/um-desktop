<script setup lang="ts">
import { useAccountStore, useBranchesStore, useContractsStore } from '#imports';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import FormButtons from '@/components/forms/FormButtons.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import BackLink from '@/components/shared/BackLink.vue';
import ChangeMasterManager from '@/components/shared/ChangeMasterManager.vue';
import type { Account } from '@/components/shared/ContractUserCard.vue';
import ContractUserCard from '@/components/shared/ContractUserCard.vue';
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import { useToast } from '@/components/ui/toast';
import { toTypedSchema } from '@vee-validate/zod';
import {
  Car,
  Download,
  File,
  FileText,
  HandCoins,
  Handshake,
  LoaderCircle,
  Save,
  UserCog,
  Users,
  X,
} from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import ContractProductEdit from '~/components/shared/ContractProductEdit.vue';
import { currencyFormat } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

const { data } = useAuth();
//@ts-expect-error
const { contractId } = data?.value?.user?.contract;
const { toast } = useToast();
const route = useRoute();

const contractsStore = useContractsStore();
const { getContractByIdAction, updateContractAction } = contractsStore;
const { contract, isLoading } = storeToRefs(contractsStore);

const accountsStore = useAccountStore();
const { getUsersAccountsByContractIdAction, updateUserAccountAction } = accountsStore;
const { accounts, inactiveAccounts } = storeToRefs(accountsStore);

const branchesStore = useBranchesStore();
const { updateBranchAction } = branchesStore;

const contractProducts = ref([]);
const contractRemainBudget = ref(0);
const calculatedBudget = ref(0);
const branchBudgetValues = reactive({} as Record<string, any>);
const pendingBranchValues = reactive({} as Record<string, any>);
const editingBranches = reactive({} as Record<string, boolean>);
const isClient = ref(false);
const loadingUpdate = ref(false);
const showAccordion = ref<string | null>(route.hash ? route.hash.replace('#', '') : null);

// ref to the CurrencyInput component to access exposed `unmaskedValue`
const mainBudgetInput = ref<any>(null);

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
  accounts.value.push(...(inactiveAccounts.value || []));
};

await fetchContractUsersData();

const customerLogoImage = reactive({
  name: contract?.value.customer?.logo?.name || '',
  url: contract?.value.customer?.logo?.url || '',
});

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
  // restore remaining budget from committed (non-pending) values
  const sum = Object.values(branchBudgetValues).reduce((s, v) => {
    const val = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
    return s + (isNaN(val) ? 0 : val);
  }, 0);
  contractRemainBudget.value = (parseFloat(contract?.value?.mainBudget) || 0) - sum;
  calculatedBudget.value = contractRemainBudget.value;
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

const sliderMax = (branchId: any) => {
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

// keep contractRemainBudget in sync when main budget changes
watch(
  () => mainBudgetInput?.value?.unmaskedValue?.value ?? form.values.mainBudget,
  (newVal) => {
    const raw = newVal ?? 0;
    const rawStr = typeof raw === 'number' ? String(raw) : String(raw);
    const numericMain =
      (rawStr.replace(/\./g, '').replace(',', '')
        ? Number(rawStr.replace(/\./g, '').replace(',', '')) / 100
        : 0) || 0;

    const sum = Object.values(branchBudgetValues).reduce((s, v) => {
      const val = Array.isArray(v) ? Number(v[0] || 0) : Number(v || 0);
      return s + (isNaN(val) ? 0 : val);
    }, 0);

    contractRemainBudget.value = numericMain - sum;
    calculatedBudget.value = contractRemainBudget.value;
  },
);

const onSubmit = form.handleSubmit(async (values) => {
  loadingUpdate.value = true;
  const payloadIds = {
    contractId: contract?.value.id,
    customerId: contract?.value.customer.id,
    managerId: contract?.value.managerId,
  };

  // CUSTOMER PAYLOAD
  const customerData = {
    document: values.document,
    name: values.name,
    fantasyName: values.fantasyName,
    address: {
      zipcode: values.zipcode,
      streetName: values.streetName,
      streetNumber: values.streetNumber,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
    },
    phone: values.phone,
    phoneExtension: values.phoneExtension,
    website: values.website,
    logo: { ...customerLogoImage },
  };

  // CONTRACT PAYLOAD
  const { id, customerId, managerId, managerName, ...restContract } = contract?.value;
  // Prefer the unmasked value exposed by the CurrencyInput component when available
  const rawMainBudget =
    mainBudgetInput?.value?.unmaskedValue?.value ?? values?.mainBudget ?? '';
  const rawMainBudgetStr =
    typeof rawMainBudget === 'number' ? String(rawMainBudget) : rawMainBudget;
  const contractData = {
    ...restContract,
    availableBudget: contractRemainBudget.value.toString(),
    mainBudget: (rawMainBudgetStr.replace('.', '').replace(',', '') / 100).toString(),
  };

  try {
    await updateContractAction({
      payloadIds,
      customerData,
      contractData,
    });

    // Update all branches first, wait until all complete to avoid race conditions
    if (contract?.value?.branches && contract.value.branches.length) {
      const branchPromises = contract.value.branches.map((branch: any) => {
        const { id, ...restBranch } = branch;
        const branchPayload = {
          branchId: id,
          contract: contract?.value.id,
          branchBudget: branch.budget,
          ...restBranch,
        };
        return updateBranchAction(branchPayload);
      });
      await Promise.all(branchPromises);
    }

    // After branches are done, update accounts
    if (accounts?.value && accounts.value.length) {
      const accountPromises = accounts.value.map((account: Account) => {
        const { id, ...restAccount } = account;
        const accountPayload = {
          accountId: id,
          ...restAccount,
        };
        return updateUserAccountAction(accountPayload);
      });
      await Promise.all(accountPromises);
    }

    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: 'Contrato atualizado com sucesso!',
    });
    loadingUpdate.value = false;
    window.location.reload();
  } catch (error) {
    loadingUpdate.value = false;
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao atualizar o contrato. Tente novamente.`,
    });
  }
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Handshake />
        Gerenciar Contrato
      </h1>
      <div class="flex gap-10 items-center">
        <Button disabled>
          <Download />
          Baixar Contrato PDF
        </Button>
        <Button disabled>
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
    <form v-else @submit.prevent="onSubmit" @keydown.enter.prevent="true">
      <section class="space-y-6">
        <Card class="bg-zinc-200" id="customer">
          <Accordion
            type="single"
            class="w-full flex flex-col gap-6"
            collapsible
            :default-value="showAccordion || undefined"
          >
            <AccordionItem value="customer">
              <AccordionTrigger class="px-6 hover:no-underline">
                <h2 class="flex items-center gap-2 text-2xl font-bold">
                  <FileText />
                  Dados da Matriz
                </h2>
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
        <Card class="bg-zinc-200" id="master-manager">
          <Accordion
            type="single"
            class="w-full flex flex-col gap-6"
            collapsible
            :default-value="showAccordion || undefined"
          >
            <AccordionItem value="master-manager">
              <AccordionTrigger class="px-6 hover:no-underline">
                <h2 class="flex items-center gap-2 text-2xl font-bold">
                  <UserCog />
                  Gestor Master do Contrato
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent>
                  <h5 class="text-muted-foreground">
                    O gestor master é responsável pelo contrato e também pela gestão das
                    filiais e seus usuários.
                  </h5>
                  <ChangeMasterManager
                    :form="form"
                    :editMode="true"
                    :managerData="contract?.manager"
                    :loading="isLoading"
                    :usersList="accounts"
                  />
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
        <Card class="bg-zinc-200" id="products">
          <Accordion
            type="single"
            class="w-full flex flex-col gap-6"
            collapsible
            :default-value="showAccordion || undefined"
          >
            <AccordionItem value="products">
              <AccordionTrigger class="px-6 hover:no-underline">
                <h2 class="flex items-center gap-2 text-2xl font-bold">
                  <Car :size="28" />
                  Produtos contratados
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent>
                  <h5 class="mb-6 text-muted-foreground">
                    Aqui você gerencia os produtos contratados e a disponibilidade por
                    filial.
                  </h5>
                  <ul class="space-y-6">
                    <ContractProductEdit
                      v-for="product in contract?.products"
                      :key="product.id"
                      :contract="contract"
                      :product="product"
                      :handleAllowProduct="handleAllowProduct"
                    />
                  </ul>
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
        <Card class="bg-zinc-200" id="budget">
          <Accordion
            type="single"
            class="w-full flex flex-col gap-6"
            collapsible
            :default-value="showAccordion || undefined"
          >
            <AccordionItem value="budget">
              <AccordionTrigger class="px-6 hover:no-underline">
                <h2 class="flex items-center gap-2 text-2xl font-bold">
                  <HandCoins />
                  Budget
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent>
                  <h5 class="mb-6 text-muted-foreground">
                    Aqui você gerencia o budget mensal do contrato e a distribuição por
                    filial.
                  </h5>
                  <div class="flex gap-4">
                    <FormField v-slot="{ componentField }" name="mainBudget">
                      <FormItem class="max-w-[250px]">
                        <FormControl>
                          <CurrencyInput
                            ref="mainBudgetInput"
                            :componentField="componentField"
                            label="Budget do Contrato"
                            :styles="'text-2xl p-6 pl-10 font-bold'"
                          />
                        </FormControl>
                        <FormMessage class="absolute" />
                      </FormItem>
                    </FormField>

                    <div class="space-y-2">
                      <Label class="text-sm font-medium">Budget não alocado</Label>
                      <h2
                        class="mt-2 p-2 text-2xl font-bold text-green-600 rounded-md border border-green-600 bg-green-100"
                        :class="
                          contractRemainBudget === 0 &&
                          'text-red-600 border-red-600 bg-red-100'
                        "
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
                              :max="sliderMax(branch.id)"
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
                            (pendingBranchValues[branch.id] = branchBudgetValues[
                              branch.id
                            ]
                              ? [...branchBudgetValues[branch.id]]
                              : [parseFloat(branch.budget) || 0]))
                          "
                        >
                          Alterar
                        </Button>
                        <template v-else>
                          <Button
                            size="icon"
                            @click.prevent="commitBranchBudget(branch.id)"
                            title="Salvar Budget"
                            class="bg-blue-600 hover:bg-blue-700"
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
        <Card class="bg-zinc-200" id="users">
          <Accordion
            type="single"
            class="w-full flex flex-col gap-6"
            collapsible
            :default-value="showAccordion || undefined"
          >
            <AccordionItem value="users">
              <AccordionTrigger class="px-6 hover:no-underline">
                <h2 class="flex items-center gap-2 text-2xl font-bold">
                  <Users />
                  Usuários ativos
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent>
                  <h5 class="mb-6 text-muted-foreground">
                    Aqui você gerencia todos os usuários do contrato e as permissões de
                    cada um.
                  </h5>
                  <ul
                    v-if="accounts && accounts.length > 0"
                    class="md:grid md:grid-cols-3 flex flex-wrap gap-6"
                  >
                    <ContractUserCard
                      v-for="account in accounts"
                      :account="account"
                      :branches="contract?.branches"
                    />
                  </ul>
                  <p v-else class="text-muted-foreground">Nenhum usuário cadastrado.</p>
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </section>
      <FormButtons
        :cancel="'/corporative'"
        :loading="loadingUpdate"
        sbm-label="Salvar Alterações"
        cnc-label="Cancelar"
        :disabled="!!Object.values(editingBranches).some(Boolean)"
      />
    </form>
  </main>
</template>

<style scoped></style>
