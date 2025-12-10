<script lang="ts" setup>
import FormSelect from '@/components/shared/FormSelect.vue';
import { rolesTypes } from '@/config/roles';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import {
  Info,
  Plus,
  SlidersHorizontal,
  Trash,
  User,
  WandSparkles,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { currencyFormat, generatePassword } from '~/lib/utils';

const contractsStore = useContractsStore();
const { getContractsAction, getContractByIdAction } = contractsStore;
const { contracts, contract } = storeToRefs(contractsStore);

const accountsStore = useAccountStore();
const { getUsersAccountsAction } = accountsStore;
const { accounts } = storeToRefs(accountsStore);

const props = defineProps<{
  editMode?: boolean;
  managerId?: string;
  contractId?: string;
  disabledFields?: boolean;
  actualBranchBudget?: any;
  branchData?: any;
  form?: any;
}>();

const ccAreasModel = defineModel<any>({
  default: [{ areaCode: '', areaName: '' }],
});

defineEmits(['update:ccAreasModel']);

const showBudgetControl = ref<boolean>(false);
const contractRemainBudget = ref(0);
const calculatedBudget = ref(0);
const contractMainBudget = ref(0);
const selectedContract = ref<any>(null);
const branchManagerUsersList = ref<any>([]);
const hasManager = ref<boolean>(false);

onBeforeMount(async () => {
  if (props.editMode) {
    await getContractByIdAction(props.contractId as string);
  }
  await getContractsAction();
});

const managerRoles = ['master-manager', 'branch-manager'];

onMounted(async () => {
  await getUsersAccountsAction();
  if (props.branchData && props.branchData.manager === null) {
    const findContractUsers = accounts.value.filter(
      (account: any) =>
        account.contract.contractId === props.contractId &&
        managerRoles.includes(account.role),
    );
    branchManagerUsersList.value = findContractUsers.map((user: any) => {
      return {
        label: `${user.username} - ${rolesTypes[user.role]}`,
        value: user.id,
      };
    });
  } else {
    hasManager.value = true;
  }
});

const sanitizeContracts = computed(() => {
  //@ts-ignore
  return contracts?.value.map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const addRow = () => {
  ccAreasModel?.value.push({ areaCode: '', areaName: '' });
};

const removeRow = (index: any) => {
  ccAreasModel.value.splice(index, 1);
};

const calculateBudgetRest = (value: any) => {
  const increment = parseFloat(value) + 1000;
  calculatedBudget.value = contractRemainBudget.value - increment;
};

const compileBudget = (value: string) => {
  if (props.editMode) {
    showBudgetControl.value = true;
    const remainBudget = contract?.value.branches.reduce(
      (acc: any, curr: any) => acc - parseFloat(curr.budget),
      contract?.value.mainBudget,
    );
    contractRemainBudget.value = remainBudget + parseFloat(props.actualBranchBudget);
    calculatedBudget.value = remainBudget;
    contractMainBudget.value = parseFloat(contract?.value.mainBudget);
  } else {
    showBudgetControl.value = true;
    const contract = contracts?.value.find((contract: any) => contract.id === value);
    console.log(contract);
    selectedContract.value = contract;
    const { branches, mainBudget } = contract;
    contractMainBudget.value = parseFloat(mainBudget);
    const remainBudget = branches.reduce(
      (acc: any, curr: any) => acc - parseFloat(curr.budget),
      contract.mainBudget,
    );
    contractRemainBudget.value = remainBudget;
    calculatedBudget.value = remainBudget;
  }
};

const setDocumentFromHQ = () => {
  if (selectedContract.value !== null) {
    props.form.setValues({
      document: selectedContract.value.customer.document,
      name: selectedContract.value.customer.name,
      fantasyName: selectedContract.value.customer.fantasyName,
      zipcode: selectedContract.value.customer.address.zipcode,
      streetName: selectedContract.value.customer.address.streetName,
      streetNumber: selectedContract.value.customer.address.streetNumber,
      complement: selectedContract.value.customer.address.complement,
      neighborhood: selectedContract.value.customer.address.neighborhood,
      city: selectedContract.value.customer.address.city,
      state: selectedContract.value.customer.address.state,
      phone: selectedContract.value.customer.phone,
      phoneExtension: selectedContract.value.customer.phoneExtension,
    });
  } else {
    props.form.setErrors({
      document: 'Selecione um contrato!',
    });
  }
};

const handleGeneratePassword = () => {
  const randomPassword = generatePassword();
  if (randomPassword.length) {
    props.form.setValues({
      password: randomPassword,
    });
  }
};
</script>
<template>
  <section class="mb-6 px-6 flex items-center justify-between">
    <div class="md:max-w-[350px]">
      <h3 v-if="editMode" class="mb-4 text-lg font-bold">1. Contrato vinculado</h3>
      <h3 v-else class="mb-4 text-lg font-bold">1. Selecione o Contrato a vincular</h3>
      <FormField v-slot="{ componentField }" name="contract">
        <FormItem>
          <FormLabel v-if="!editMode">Contrato</FormLabel>
          <FormControl>
            <FormSelect
              v-bind="componentField"
              :items="sanitizeContracts"
              :label="'Selecione'"
              @on-select="compileBudget"
              :disabled="editMode"
            />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
    <div v-if="editMode">
      <FormField v-slot="{ componentField }" name="status">
        <FormItem class="grid grid-cols-2 items-center gap-4">
          <FormLabel class="font-bold">Status do Contrato</FormLabel>
          <FormControl>
            <FormSelect
              v-bind="componentField"
              :items="[
                {
                  label: 'Validado',
                  value: 'validated',
                },
                {
                  label: 'Pendente',
                  value: 'pending',
                },
              ]"
              label="Selecione"
            />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
  </section>
  <section class="px-6">
    <h3 v-if="editMode" class="mb-4 text-lg font-bold">2. Dados da Filial</h3>
    <h3 v-else class="mb-4 text-lg font-bold">2. Insira os dados da Filial</h3>
    <div class="mb-4 w-full md:grid md:grid-cols-5 gap-6">
      <FormField v-slot="{ componentField }" name="branchCode">
        <FormItem>
          <FormLabel>Código da Filial</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <div class="col-span-2 flex items-end justify-start gap-3 relative">
        <FormField v-slot="{ componentField }" name="document">
          <FormItem class="flex-1">
            <FormLabel>CNPJ</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" v-maska="'##.###.###/####-##'" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <Button
          v-if="selectedContract !== null"
          class="relative bottom-[3px] max-w-[180px]"
          @click.prevent="setDocumentFromHQ"
        >
          Usar Dados Matriz
        </Button>
      </div>
      <FormField v-slot="{ componentField }" name="name">
        <FormItem>
          <FormLabel>Razão Social</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="fantasyName">
        <FormItem>
          <FormLabel>Nome Fantasia</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
    <slot />
    <div class="mb-4 w-full grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="phone">
        <FormItem>
          <FormLabel>Telefone</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" v-maska="'(##) ####-####'" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="phoneExtension">
        <FormItem>
          <FormLabel>Ramal</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
  </section>
  <section class="p-6">
    <h3 v-if="editMode" class="mb-4 text-lg font-bold">3. Dados do Gestor da Filial</h3>
    <div v-if="branchData?.manager === null" class="flex flex-col items-start">
      <div class="my-4 px-4 bg-red-200">
        <small class="text-red-500">
          *Contrato ainda não possui um Gestor Master atribuído. Selecione um usuário com
          perfil Gestor Master na lista abaixo.
        </small>
      </div>
      <div class="grid grid-cols-4 gap-6 w-full">
        <FormField v-slot="{ componentField }" name="managerId">
          <FormItem class="col-span-1">
            <FormLabel class="font-bold">Selecionar Gestor da Filial</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="branchManagerUsersList"
                label="Selecione"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </div>
    <h3 v-if="!editMode" class="mb-4 text-lg font-bold">3. Gestor da Filial</h3>
    <div v-if="branchData?.manager !== null" class="mb-4 grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="branchManagerName">
        <FormItem>
          <FormLabel>Nomes</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="branchManagerPhone">
        <FormItem>
          <FormLabel>Celular</FormLabel>
          <FormControl>
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'(##) #####-####'"
              :disabled="editMode"
            />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="branchManagerPosition">
        <FormItem>
          <FormLabel>Cargo</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="branchManagerDepartment">
        <FormItem>
          <FormLabel>Departamento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" :disabled="editMode" />
          </FormControl>
        </FormItem>
      </FormField>
      <div class="col-span-4 p-6 border border-zinc-900 rounded-md">
        <p class="font-bold">Dados de Acesso</p>
        <div v-if="editMode">
          <p class="flex gap-1 items-center text-muted-foreground text-sm">
            <Info :size="14" />
            Para editar os dados de acesso (Nome, Email e Senha) do Gestor da Filial
            clique no botão abaixo
          </p>
          <Button
            type="button"
            class="my-4"
            @click="
              navigateTo(
                {
                  name: 'admin-accounts-edit-id',
                  params: { id: managerId },
                },
                { open: { target: '_blank' } },
              )
            "
          >
            <User />
            Editar Conta de Usuário
          </Button>
        </div>
        <div v-else>
          <p class="flex gap-1 items-center text-muted-foreground text-sm">
            <Info :size="14" />
            O Gestor da Filial usará os dados abaixo para acessar a plataforma
          </p>
          <div class="mt-6 grid grid-cols-3 gap-6 items-end">
            <FormField v-slot="{ componentField }" name="branchManagerEmail">
              <FormItem class="relative">
                <FormLabel>E-mail de Acesso</FormLabel>
                <FormControl>
                  <Input type="email" v-bind="componentField" />
                </FormControl>
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Senha Temporária</FormLabel>
                <FormControl>
                  <Input type="text" v-bind="componentField" maxlength="8" />
                </FormControl>
              </FormItem>
            </FormField>
            <Button
              class="mb-1 px-2 max-w-[140px]"
              @click.prevent="handleGeneratePassword"
            >
              <WandSparkles class="w-6 h-6" />
              Gerar Senha
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="p-6">
    <h3 class="mb-4 text-lg font-bold">4. Gerenciar Budget da Filial</h3>
    <div v-if="showBudgetControl" class="p-6 border border-zinc-700 rounded-md">
      <FormField v-slot="{ componentField, value }" name="branchBudget">
        <FormItem>
          <FormLabel class="mb-10 flex items-center justify-between">
            <span>Budget da Filial</span>
            <span>Saldo do Budget do Contrato</span>
          </FormLabel>
          <FormControl>
            <Slider
              :model-value="componentField.modelValue"
              :default-value="[0]"
              :max="contractMainBudget"
              :min="0"
              :step="1000"
              :name="componentField.name"
              @update:model-value="componentField['onUpdate:modelValue']"
              @input="calculateBudgetRest(value)"
              class="mt-4"
              :class="`${calculatedBudget < 0 ? 'bg-red-600' : ''}`"
            />
            <FormDescription class="flex items-center justify-between gap-2">
              <span class="my-2 font-bold text-2xl text-black">
                {{ currencyFormat(value?.[0]) }}
              </span>
              <div class="flex flex-col items-end">
                <span
                  class="my-2 font-bold text-2xl text-black"
                  :class="`${calculatedBudget < 0 ? 'text-red-600' : ''}`"
                >
                  {{ currencyFormat(calculatedBudget.toString()) }}
                </span>
                <span v-if="calculatedBudget < 0" class="text-red-600">
                  Você entrou no limite extra do Budget
                </span>
              </div>
            </FormDescription>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
    <div v-else class="p-6 border border-zinc-700 rounded-md">
      <div v-if="props.editMode" class="flex items-center justify-between gap-4">
        <h2 class="font-bold text-2xl">
          {{ currencyFormat(props.form?.values?.branchBudget?.toString()) }}
        </h2>
        <Button type="button" @click.prevent="compileBudget(props.contractId as string)">
          <SlidersHorizontal />
          Editar Budget
        </Button>
      </div>
      <h2 v-else class="flex items-center justify-center gap-2">
        <Info :size="20" />
        Vincule um Contrato para gerenciar o Budget da Filial
      </h2>
    </div>
  </section>
  <section class="p-6">
    <h3 class="mb-4 text-lg font-bold">5. Gerenciar Centros de Custo</h3>
    <div class="p-6 rounded-md bg-zinc-100">
      <h3 class="mb-4 font-bold">Centro de Custo / Áreas Cadastradas</h3>
      <div
        class="mb-4 md:grid md:grid-cols-6 gap-4 items-end"
        v-for="(area, index) in modelValue"
      >
        <FormField name="areaCode">
          <FormItem>
            <FormLabel>Código</FormLabel>
            <FormControl>
              <Input type="text" v-model="area.areaCode" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField name="areaName">
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input type="text" v-model="area.areaName" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <div class="py-3 flex items-center">
          <div class="mt-2 flex gap-2 items-center">
            <Trash
              v-if="index > 0"
              @click.prevent="removeRow(index)"
              class="w-5 h-5 text-zinc-800 cursor-pointer hover:text-red-600"
            />
          </div>
        </div>
      </div>
      <Button type="button" @click.prevent="addRow">
        <Plus />
        Adicionar
      </Button>
    </div>
  </section>
</template>
