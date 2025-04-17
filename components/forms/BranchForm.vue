<script lang="ts" setup>
import FormSelect from '@/components/shared/FormSelect.vue';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle, Lock, Search, WandSparkles } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { useForm } from 'vee-validate';
import * as z from 'zod';

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;
const { contracts, isLoading } = storeToRefs(contractsStore);

definePageMeta({
  name: 'BranchForm',
});

defineProps<{
  findAddress?: any;
  loading?: boolean;
  isEditing?: boolean;
}>();

onBeforeMount(async () => {
  await getContractsAction();
});

const sanitizeContracts = computed(() => {
  //@ts-ignore
  return contractsStore.contracts?.map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const formSchema = toTypedSchema(
  z.object({
    contract: z.string({ message: 'Obrigatório' }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});
</script>
<template v-if="currentStep === 0">
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
    <h3 class="my-6 px-6">***ADICIONAR NUMERO DA FILIAL***</h3>
  </section>
  <section class="px-6">
    <h3 class="mb-4 text-lg font-bold">2. Insira os dados da Filial</h3>
    <div class="mb-4 w-full grid grid-cols-3 gap-6">
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
                name="zipcode"
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
      <FormField v-slot="{ componentField }" name="managerName">
        <FormItem>
          <FormLabel>Nome</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="managerCellPhone">
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
      <FormField v-slot="{ componentField }" name="position">
        <FormItem>
          <FormLabel>Cargo</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="department">
        <FormItem>
          <FormLabel>Departamento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <div class="col-span-4 p-6 border border-zinc-900 rounded-md">
        <p class="font-bold">Dados de Acesso</p>
        <p class="text-muted-foreground text-sm">
          O Gestor da Filial usará os dados abaixo para acessar a plataforma
        </p>
        <div class="mt-6 grid grid-cols-3 gap-6 items-end">
          <FormField v-slot="{ componentField }" name="managerEmail">
            <FormItem class="relative">
              <FormLabel>E-mail de Acesso</FormLabel>
              <FormControl>
                <Input type="email" v-bind="componentField" />
              </FormControl>
              <FormMessage
                class="p-2 absolute w-full bg-red-500 text-white text-sm rounded-md"
              />
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
            v-if="editMode"
            class="mb-1 px-2 max-w-[190px]"
            @click.prevent=""
          >
            <Lock class="w-6 h-6" />
            Gerar Nova Senha
          </Button>
          <Button v-else class="mb-1 px-2 max-w-[140px]" @click.prevent="">
            <WandSparkles class="w-6 h-6" />
            Gerar Senha
          </Button>
        </div>
      </div>
    </div>
  </section>
  <section class="p-6">
    <h3 class="mb-4 text-lg font-bold">4. Gerenciar Budget</h3>
    <h3 class="mb-4 text-lg font-bold">5. Gerenciar Centro de Custo</h3>
  </section>
</template>
