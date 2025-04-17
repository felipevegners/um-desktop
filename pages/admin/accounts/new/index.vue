<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { useAccountStore } from '@/stores/admin/account.store';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, LoaderCircle, UserPen } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Nova Conta de Usuário | Urban Mobi',
});

const { toast } = useToast();

const accountStore = useAccountStore();
const { registerUserAccountAction, updateUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;
const { isLoading } = storeToRefs(contractsStore);

await getContractsAction();

const viewPassword = ref<boolean>(false);
const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const userData = ref<any>({
  contractId: '',
  customerId: '',
  customerName: '',
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
    status: z.string(),
    contract: z.any().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const compileUserData = (value: string) => {
  userData.value.contractId = '';

  const filtered = contractsStore.contracts?.find(
    (contract: any) => contract.id === value,
  );
  userData.value.contractId = filtered.id;
  userData.value.customerId = filtered.customerId;
  userData.value.customerName = filtered.customerName;
};

const onSubmit = form.handleSubmit(async (values) => {
  if (values.role === 'platform-user') {
    const filtered = contractsStore.contracts?.find((contract: any) =>
      contract.customerName.includes('Urban Mobi'),
    );
    userData.value.contractId = filtered.id;
    userData.value.customerId = filtered.customerId;
    userData.value.customerName = filtered.customerName;
  }
  const accountData = {
    accountId: '',
    username: values.userName,
    password: values.userPassword,
    email: values.userEmail,
    role: values.role,
    enabled: true,
    status: values.status,
    contractId: userData.value.contractId,
    customerName: userData.value.customerName,
    customerId: userData.value.customerId,
    avatar: {
      name: '',
      url: '',
    },
  };

  try {
    await registerUserAccountAction(accountData);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar a Conta de Usuário. Tente novamente.`,
    });
    throw error;
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: 'Conta de Usuário cadastrado com sucesso!',
    });
    navigateTo('/admin/accounts/active');
  }
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center gap-4">
      <UserPen :size="32" />
      <h1 class="font-bold text-black text-3xl">Criar Usuário</h1>
    </section>
    <section>
      <form @submit="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardHeader class="mb-6">
            <CardTitle class="mb-4">Dados do novo usuário</CardTitle>
            <div class="md:max-w-[350px]">
              <FormField v-slot="{ componentField }" name="status">
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <FormSelect
                      v-bind="componentField"
                      :items="[
                        { label: 'Validado', value: 'validated' },
                        { label: 'Pendente', value: 'pending' },
                      ]"
                      :label="'Selecione'"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
          </CardHeader>
          <CardContent>
            <div class="mb-6 flex flex-col md:grid md:grid-cols-3 gap-10">
              <div class="md:max-w-[350px]">
                <h3 class="mb-4 text-lg font-bold">
                  1. Selecione o tipo de acesso
                </h3>
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
                          {
                            label: 'Usuário Corporativo',
                            value: 'platform-corp-user',
                          },
                          { label: 'Usuário UM', value: 'platform-user' },
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
                <h3 class="mb-4 text-lg font-bold">
                  3. Insira os dados do usuário
                </h3>
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
                      <FormLabel> Senha</FormLabel>
                      <FormControl>
                        <div v-if="viewPassword" class="relative">
                          <Input
                            type="text"
                            placeholder="Insira a senha"
                            v-bind="componentField"
                            :disabled="isLoading"
                          />
                          <EyeOff
                            class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                            :class="
                              viewPassword ? 'text-zinc-700' : 'text-zinc-400'
                            "
                            @click.prevent="revealPassword"
                          />
                        </div>
                        <div v-else class="relative">
                          <Input
                            type="password"
                            placeholder="Insira a senha"
                            v-bind="componentField"
                            :disabled="isLoading"
                          />
                          <Eye
                            class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                            :class="
                              viewPassword ? 'text-zinc-700' : 'text-zinc-400'
                            "
                            @click.prevent="revealPassword"
                          />
                        </div>
                      </FormControl>
                      <small>*A senha deve conter de 6 a 8 caracteres</small>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </div>
              <div
                v-if="
                  form.values.role === 'admin' ||
                  form.values.role === 'platform-user'
                "
                class="md:max-w-[350px]"
              >
                <h3 class="mb-4 text-lg font-bold">
                  2. Insira os dados do usuário
                </h3>
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
                      <FormControl>
                        <div v-if="viewPassword" class="relative">
                          <Input
                            type="text"
                            placeholder="Insira a senha"
                            v-bind="componentField"
                            :disabled="isLoading"
                          />
                          <EyeOff
                            class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                            :class="
                              viewPassword ? 'text-zinc-700' : 'text-zinc-400'
                            "
                            @click.prevent="revealPassword"
                          />
                        </div>
                        <div v-else class="relative">
                          <Input
                            type="password"
                            placeholder="Insira a senha"
                            v-bind="componentField"
                            :disabled="isLoading"
                          />
                          <Eye
                            class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                            :class="
                              viewPassword ? 'text-zinc-700' : 'text-zinc-400'
                            "
                            @click.prevent="revealPassword"
                          />
                        </div>
                      </FormControl>
                      <small>*A senha deve conter de 6 a 8 caracteres</small>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div class="mt-6 flex gap-4">
          <Button type="submit">
            <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />
            Registrar Usuário
          </Button>
          <Button
            type="button"
            variant="ghost"
            @click.prevent="navigateTo('/admin/accounts/active')"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
