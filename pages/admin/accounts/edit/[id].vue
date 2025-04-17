<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAccountStore } from '@/stores/admin/account.store';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Trash, UserPen } from 'lucide-vue-next';
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { onBeforeMount } from 'vue';
import * as z from 'zod';

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;

const accountStore = useAccountStore();
const {
  getUsersAccountsAction,
  deleteUserAccountAction,
  getUsersAccountsByIdAction,
  updateUserAccountAction,
} = accountStore;
const { isLoadingSend, account } = storeToRefs(accountStore);

const route = useRoute();
const { toast } = useToast();
const { data } = useAuth();
//@ts-ignore
const { user } = data.value;

await getUsersAccountsByIdAction(route?.params?.id as string);
await getContractsAction();
definePageMeta({
  layout: 'admin',
});

defineOptions({
  name: 'Backoffice - Editar Conta de Usuário | Urban Mobi',
});

const accountSituation = ref<boolean>(false);
const accountData = ref<any>();
const loadingDelete = ref<boolean>(false);
const viewPassword = ref<boolean>(false);
const userData = ref<any>({
  contractId: account?.value?.contractId,
  customerId: account?.value?.customerId,
  customerName: account?.value?.customerName,
});
accountSituation.value = account?.value?.enabled;

const compileUserData = (value: string) => {
  userData.value.contractId = '';

  const filtered = contractsStore.contracts?.find(
    (contract: any) => contract.id === value,
  );
  userData.value.contractId = filtered.id;
  userData.value.customerId = filtered.customerId;
  userData.value.customerName = filtered.customerName;
};

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
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

const deleteUserAccount = async () => {
  loadingDelete.value = true;
  try {
    await deleteUserAccountAction(route.params.id as string);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao remover a conta de usuário. Tente novamente.`,
    });
    throw error;
  } finally {
    loadingDelete.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Conta de Usuário removida com sucesso!`,
    });
    await getUsersAccountsAction();
  }
};

const formSchema = toTypedSchema(
  z.object({
    userName: z
      .string({ message: 'Obrigatório' })
      .min(2, 'Mínimo 2 caracteres')
      .max(40, 'Máximo 40 caracteres'),
    userEmail: z.string().min(2, 'Insira um e-mail válido').max(100).email(),
    newPassword: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .max(8, 'Máximo de 8 caracteres')
      .optional(),
    role: z.string().min(2).max(20),
    status: z.string(),
    contract: z.any().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    userName: account?.value.username,
    userEmail: account?.value.email,
    role: account?.value.role,
    contract: account?.value.contractId,
    status: account?.value.status,
  },
});

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
    password: values.newPassword || '',
    email: values.userEmail,
    role: values.role,
    enabled: accountSituation.value,
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
    accountData.accountId = account?.value.id;
    await updateUserAccountAction(accountData);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao editar o usuário. Tente novamente.`,
    });
    throw error;
  } finally {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: 'Conta de Usuário alterada com sucesso!',
    });
    navigateTo('/admin/accounts/active');
  }
});
</script>
<template>
  <main>
    <header>
      <BackLink />
    </header>
    <section class="px-6 mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-3xl font-bold">
        <UserPen :size="32" />
        Editar Conta de Usuário
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Usuário </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="accountSituation"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativo </Label>
          </div>
        </div>
        <Button variant="destructive" @click="deleteUserAccount">
          <Trash class="w-4 h-4" /> Excluir Usuário
        </Button>
      </div>
    </section>
    <section class="p-6">
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
                  <FormField v-slot="{ componentField }" name="newPassword">
                    <FormItem class="relative">
                      <FormLabel> Alterar Senha </FormLabel>
                      <FormControl>
                        <div v-if="viewPassword" class="relative">
                          <Input
                            type="text"
                            placeholder="Insira a senha"
                            v-bind="componentField"
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
                  <FormField v-slot="{ componentField }" name="newPassword">
                    <FormItem class="relative">
                      <FormLabel>Alterar Senha</FormLabel>
                      <FormControl>
                        <div v-if="viewPassword" class="relative">
                          <Input
                            type="text"
                            placeholder="Insira a senha"
                            v-bind="componentField"
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
            Salvar Alterações
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
    <pre>{{ accountData }}</pre>
  </main>
</template>

<style scoped></style>
