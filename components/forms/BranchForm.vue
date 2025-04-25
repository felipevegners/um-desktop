<script lang="ts" setup>
import FormSelect from '@/components/shared/FormSelect.vue';
import { useContractsStore } from '@/stores/admin/contracts.store';
import {
  Info,
  LoaderCircle,
  Plus,
  Search,
  Trash,
  User,
  WandSparkles,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { currencyFormat } from '~/lib/utils';

const contractsStore = useContractsStore();
const { getContractsAction, getContractByIdAction } = contractsStore;
const { contracts, contract } = storeToRefs(contractsStore);

const props = defineProps<{
  findAddress?: any;
  loading?: boolean;
  editMode?: boolean;
  managerId?: string;
  contractId?: string;
  disabledFields?: boolean;
  form?: any;
}>();

const modelValue = defineModel<any>({
  default: [{ areaCode: '', areaName: '' }],
});

defineEmits(['update:modelValue']);

onBeforeMount(async () => {
  if (props.editMode) {
    await getContractByIdAction(props.contractId as string);
  }
  await getContractsAction();
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
  modelValue?.value.push({ areaCode: '', areaName: '' });
};

const removeRow = (index: any) => {
  modelValue.value.splice(index, 1);
};

const calculateBudgetRest = (value: any) => {
  const result = parseFloat(contract?.value.mainBudget) - parseFloat(value);
  return currencyFormat(result.toString());
};
</script>
<template>
  <section class="mb-6 px-6 flex items-center justify-between">
    <div class="md:max-w-[350px]">
      <h3 v-if="editMode" class="mb-4 text-lg font-bold">
        1. Contrato vinculado
      </h3>
      <h3 v-else class="mb-4 text-lg font-bold">
        1. Selecione o Contrato a vincular
      </h3>
      <FormField v-slot="{ componentField, value }" name="contract">
        <FormItem>
          <FormLabel v-if="!editMode">Contrato</FormLabel>
          <FormControl>
            <FormSelect
              v-bind="componentField"
              :items="sanitizeContracts"
              :label="'Selecione'"
            />
            <!-- @on-select="compileBudget" -->
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
    <div class="mb-6 max-w-[150px]"></div>
    <div class="mb-4 w-full md:grid md:grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="branchCode">
        <FormItem>
          <FormLabel>Código da Filial</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="document">
        <FormItem>
          <FormLabel>CNPJ</FormLabel>
          <FormControl>
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'##.###.###/####-##'"
            />
          </FormControl>
        </FormItem>
      </FormField>
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
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'(##) ####-####'"
            />
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
    <h3 v-if="editMode" class="mb-4 text-lg font-bold">
      3. Dados do Gestor da Filial
    </h3>
    <h3 v-else class="mb-4 text-lg font-bold">3. Gestor da Filial</h3>
    <div class="mb-4 grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="branchManagerName">
        <FormItem>
          <FormLabel>Nome</FormLabel>
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
              v-maska="'(##) # ####-####'"
            />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="branchManagerPosition">
        <FormItem>
          <FormLabel>Cargo</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="branchManagerDepartment">
        <FormItem>
          <FormLabel>Departamento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <div class="col-span-4 p-6 border border-zinc-900 rounded-md">
        <p class="font-bold">Dados de Acesso</p>
        <div v-if="editMode">
          <p class="flex gap-1 items-center text-muted-foreground text-sm">
            <Info :size="14" />
            Para editar os dados de acesso (Nome, Email e Senha) do Gestor da
            Filial clique no botão abaixo
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
            <Button class="mb-1 px-2 max-w-[140px]" @click.prevent="">
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
    <div class="p-6 border border-zinc-700 rounded-md">
      <FormField v-slot="{ componentField, value }" name="branchBudget">
        <FormItem>
          <FormLabel class="mb-10 flex items-center justify-between">
            <span>Budget da Filial</span>
            <span>Budget total do contrato</span>
          </FormLabel>
          <FormControl>
            <Slider
              :model-value="componentField.modelValue"
              :default-value="[0]"
              :max="190000"
              :min="0"
              :step="1000"
              :name="componentField.name"
              @update:model-value="componentField['onUpdate:modelValue']"
              class="mt-4"
            />
            <FormDescription class="flex items-center justify-between gap-2">
              <span class="my-2 font-bold text-2xl text-black">
                {{ currencyFormat(value?.[0]) }}
              </span>
              <span class="my-2 font-bold text-2xl text-black">
                {{ calculateBudgetRest(value) }}
              </span>
            </FormDescription>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
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
      <Button
        type="button"
        variant="outline"
        class="hover:border-zinc-900"
        @click.prevent="addRow"
      >
        <Plus />
        Adicionar
      </Button>
    </div>
  </section>
</template>
