<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { useAccountStore } from '@/stores/admin/account.store';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { onBeforeMount } from 'vue';
import * as z from 'zod';

const { toast } = useToast();

const accountStore = useAccountStore();
const { registerUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;
const { contracts, isLoading } = storeToRefs(contractsStore);

onBeforeMount(async () => {
  await getContractsAction();
});

definePageMeta({
  title: 'RegisterForm',
});

const emit = defineEmits(['view-form']);

const props = defineProps(['accountRole']);

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
    userName: z
      .string({ message: 'Obrigatório' })
      .min(2, 'Mínimo 2 caracteres')
      .max(40, 'Máximo 40 caracteres'),
    userEmail: z.string().min(2, 'Insira um e-mail válido').max(100).email(),
    userPassword: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .max(8, 'Máximo de 8 caracteres'),
    role: z.string().min(2).max(20),
    contract: z.any().optional(),
  }),
);

const viewPassword = ref<boolean>(false);
const userData = ref<any>({
  customerId: '',
  customerName: '',
  contractId: '',
});

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const form = useForm({
  validationSchema: formSchema,
});

const compileUserData = (value: string) => {
  userData.value.contractId = '';

  const filtered = contractsStore.contracts?.find(
    (contract: any) => contract.id === value,
  );
  userData.value.customerId = filtered.customerId;
  userData.value.customerName = filtered.customerName;
  userData.value.contractId = filtered.id;
};

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    username: values.userName,
    password: values.userPassword,
    email: values.userEmail,
    role: values.role,
    enabled: true,
    status: 'pending',
    contractId: userData.value.contractId,
  };

  try {
    await registerUserAccountAction(accountData);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Usuário cadastrado com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar o usuário. Tente novamente.`,
    });
    throw error;
  }
});
</script>
<template>
  <form @submit="onSubmit" @keydown.enter.prevent="true">
    <div class="flex flex-col md:grid md:grid-cols-3 gap-10">
      <div class="md:max-w-[350px]">
        <h3 class="mb-4 text-lg font-bold">1. Selecione o tipo de acesso</h3>
        <FormField v-slot="{ componentField }" name="role">
          <FormItem>
            <FormLabel>Tipo de Acesso</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="[
                  { label: 'Backoffice', value: 'admin' },
                  { label: 'Gestor Master', value: 'master-manager' },
                  { label: 'Gestor Filial', value: 'branch-manager' },
                  { label: 'Administrador', value: 'platform-admin' },
                  { label: 'Usuário Corporativo', value: 'platform-corp-user' },
                  { label: 'Usuário', value: 'platform-user' },
                ]"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <div
        v-if="
          form.values.role === 'master-manager' ||
          form.values.role === 'branch-manager' ||
          form.values.role === 'platform-admin' ||
          form.values.role === 'platform-corp-user'
        "
        class="md:max-w-[350px]"
      >
        <h3 class="mb-4 text-lg font-bold">
          2. Selecione o Contrato a vincular
        </h3>
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
      <div v-if="form.values.contract">
        <h3 class="mb-4 text-lg font-bold">3. Insira os dados do usuário</h3>
        <div class="flex flex-col gap-4 md:max-w-[350px]">
          <FormField v-slot="{ componentField }" name="userName">
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="userEmail">
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="userPassword">
            <FormItem class="relative">
              <FormLabel>Senha</FormLabel>
              <FormControl class="relative">
                <Input
                  v-if="viewPassword"
                  type="text"
                  placeholder="Insira a senha"
                  v-bind="componentField"
                />
                <Input
                  v-else
                  type="password"
                  placeholder="Insira a senha"
                  v-bind="componentField"
                />
                <Eye
                  class="h-5 w-5 absolute top-8 right-3 cursor-pointer hover:text-zinc-700"
                  :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                  @click.prevent="revealPassword"
                />
              </FormControl>
              <small>*A senha deve conter de 6 a 8 caracteres</small>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex gap-4">
            <Button type="submit">
              <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />
              Registrar
            </Button>
            <Button type="button" variant="ghost" @click="emit('view-form')">
              Cancelar
            </Button>
          </div>
        </div>
      </div>

      <div
        v-if="
          form.values.role === 'admin' || form.values.role === 'platform-user'
        "
        class="md:max-w-[350px]"
      >
        <h3 class="mb-4 text-lg font-bold">2. Insira os dados do usuário</h3>
        <div class="flex flex-col gap-4">
          <FormField v-slot="{ componentField }" name="userName">
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="userEmail">
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="userPassword">
            <FormItem class="relative">
              <FormLabel>Senha</FormLabel>
              <FormControl class="relative">
                <Input
                  v-if="viewPassword"
                  type="text"
                  placeholder="Insira a senha"
                  v-bind="componentField"
                />
                <Input
                  v-else
                  type="password"
                  placeholder="Insira a senha"
                  v-bind="componentField"
                />
                <Eye
                  class="h-5 w-5 absolute top-8 right-3 cursor-pointer hover:text-zinc-700"
                  :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                  @click.prevent="revealPassword"
                />
              </FormControl>
              <small>*A senha deve conter de 6 a 8 caracteres</small>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex gap-4">
            <Button type="submit">
              <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />
              Registrar
            </Button>
            <Button type="button" variant="ghost" @click="emit('view-form')">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped></style>
