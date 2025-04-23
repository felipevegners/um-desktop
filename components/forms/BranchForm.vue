<script lang="ts" setup>
import FormSelect from '@/components/shared/FormSelect.vue';
import { useContractsStore } from '@/stores/admin/contracts.store';
import {
  Info,
  LoaderCircle,
  Plus,
  Search,
  Trash,
  WandSparkles,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { currencyFormat } from '~/lib/utils';

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;

defineProps<{
  findAddress?: any;
  loading?: boolean;
  isEditing?: boolean;
  disabledFields?: boolean;
}>();

const modelValue = defineModel<any>({
  default: [{ areaCode: '', areaName: '' }],
});

defineEmits(['update:modelValue']);

onBeforeMount(async () => {
  await getContractsAction();
});

const mainBudget = ref('');
const calculatedBudget = ref('');

const calculateBudget = (event: any) => {
  const { value } = event.target;
  const sum = parseFloat(mainBudget.value) - parseFloat(value);
  if (value === '') {
    calculatedBudget.value = mainBudget.value;
  } else {
    calculatedBudget.value = sum.toString();
  }
};

const sanitizeContracts = computed(() => {
  //@ts-ignore
  return contractsStore.contracts?.map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const compileUserData = (value: string) => {
  const filtered = contractsStore.contracts?.find(
    (contract: any) => contract.id === value,
  );
  mainBudget.value = filtered.mainBudget;
  calculatedBudget.value = filtered.mainBudget;
};

const addRow = () => {
  modelValue?.value.push({ areaCode: '', areaName: '' });
};

const removeRow = (index: any) => {
  modelValue.splice(index, 1);
};
</script>
<template>
  <section>
    <div class="px-6 max-w-[350px]">
      <h3 class="mb-4 text-lg font-bold">1. Selecione o Contrato a vincular</h3>
      <FormField v-slot="{ componentField }" name="contract">
        <FormItem>
          <FormLabel>Contrato</FormLabel>
          <FormControl>
            <FormSelect
              v-bind="componentField"
              :items="sanitizeContracts"
              :label="'Selecione'"
              @on-select="compileUserData"
            />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
  </section>
  <section class="px-6">
    <h3 class="mb-4 text-lg font-bold">2. Insira os dados da Filial</h3>
    <div class="mb-6 max-w-[150px]">
      <FormField v-slot="{ componentField }" name="branchCode">
        <FormItem>
          <FormLabel>Código da Filial</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
    <div class="mb-4 w-full md:grid md:grid-cols-3 gap-6">
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
    <div class="mb-4 w-full grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField, value }" name="zipcode">
        <FormItem class="col-span-1">
          <FormLabel>CEP</FormLabel>
          <FormControl>
            <div class="flex gap-2">
              <Input
                type="text"
                v-bind="componentField"
                maxlength="9"
                v-maska="'#####-###'"
              />
              <Button
                @click.prevent="findAddress(value)"
                :disabled="value?.length !== 9"
                type="button"
              >
                <Search v-if="!loading" class="w-10 h-10" />
                <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
              </Button>
            </div>
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="streetName">
        <FormItem class="col-span-2">
          <FormLabel>Endereço</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="streetNumber">
        <FormItem class="col-span-1">
          <FormLabel>Número</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="complement">
        <FormItem class="col-span-1">
          <FormLabel>Complemento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="neighborhood">
        <FormItem class="col-span-1">
          <FormLabel>Bairro</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="city">
        <FormItem class="col-span-1">
          <FormLabel>Cidade</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="state">
        <FormItem class="col-span-1">
          <FormLabel>Estado</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
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
    <h3 class="mb-4 text-lg font-bold">3. Gestor da Filial</h3>
    <div class="mb-4 grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="branchManagerName">
        <FormItem>
          <FormLabel>Nome</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
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
        <p class="flex items-center gap-1 text-muted-foreground text-sm">
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
              <!-- <FormMessage
                class="p-2 absolute w-full bg-red-500 text-white text-sm rounded-md"
              /> -->
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
          <!-- <Button
            v-if="editMode"
            class="mb-1 px-2 max-w-[190px]"
            @click.prevent=""
          >
            <Lock class="w-6 h-6" />
            Gerar Nova Senha
          </Button> -->
          <Button class="mb-1 px-2 max-w-[140px]" @click.prevent="">
            <WandSparkles class="w-6 h-6" />
            Gerar Senha
          </Button>
        </div>
      </div>
    </div>
  </section>
  <section class="p-6">
    <h3 class="mb-4 text-lg font-bold">4. Gerenciar Budget</h3>

    <div class="flex gap-6">
      <div
        class="p-6 flex flex-col gap-4 max-w-[300px] border border-zinc-700 rounded-md"
      >
        <span class="text-muted-foreground text-sm"
          >Budget total do contrato</span
        >
        <h1 v-if="mainBudget === ''" class="font-bold text-3xl">
          {{ currencyFormat('0') }}
        </h1>
        <h1 v-else class="font-bold text-3xl">
          {{ currencyFormat(calculatedBudget) }}
        </h1>
      </div>
      <div class="p-6 max-w-[300px] border border-zinc-700 rounded-md">
        <FormField v-slot="{ componentField }" name="branchBudget">
          <FormItem>
            <FormLabel>Budget da Filial (R$)</FormLabel>
            <FormControl>
              <Input
                type="text"
                v-bind="componentField"
                class="text-3xl h-20"
                @input="calculateBudget"
                :disabled="!disabledFields"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </div>
  </section>
  <section class="p-6">
    <h3 class="mb-4 text-lg font-bold">5. Gerenciar Centros de Custo</h3>
    <div class="p-6 rounded-md bg-zinc-100">
      <h3 class="mb-4 font-bold">Adicionar CC ou Área</h3>
      <div
        class="mb-4 md:grid md:grid-cols-3 gap-4 items-end"
        v-for="(area, index) in modelValue"
      >
        <FormField name="areaCode">
          <FormItem>
            <FormLabel>Código</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: CC0001"
                v-model="area.areaCode"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField name="areaName">
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: Jurídico"
                v-model="area.areaName"
              />
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
            <Plus
              class="text-white bg-zinc-800 h-5 w-5 rounded-full cursor-pointer hover:bg-zinc-600"
              @click.prevent="addRow"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
