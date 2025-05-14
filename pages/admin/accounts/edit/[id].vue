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
const { getContractsAction, getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

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
const loadingAreas = ref<boolean>(false);
const viewPassword = ref<boolean>(false);
const contractName = ref('');
const branchesList = ref<any>([]);
const branchAreasList = ref<any>([]);
const { role } = account?.value;

accountSituation.value = account?.value?.enabled;
contractName.value = role === 'admin' ? '-' : account?.value.contract?.name;

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

onBeforeMount(() => {
  if (role !== 'admin') {
    const contract = contractsStore.contracts.find(
      (contract: any) => contract.id === account?.value.contract.contractId,
    );
    if (
      role === 'platform-admin' ||
      role === 'branch-manager' ||
      role === 'platform-corp-user'
    ) {
      branchesList.value = contract?.branches?.map((branch: any) => {
        return {
          label: `${branch.branchCode} - ${branch.name}`,
          value: branch.id,
        };
      });
      const branch = contract?.branches?.find(
        (branch: any) => branch.id === account.value.contract.branchId,
      );

      branchAreasList.value = branch?.areas?.map((area: any) => {
        return {
          label: `${area.areaCode} - ${area.areaName}`,
          value: area.areaCode,
        };
      });
    }
  }
});

const checkUserRole = computed(() => {
  return (
    role === 'platform-admin' ||
    role === 'branch-manager' ||
    role === 'platform-corp-user'
  );
});

const getBranchAreas = (value: string) => {
  loadingAreas.value = true;
  const contract = contractsStore.contracts.find(
    (contract: any) => contract.id === account?.value.contract.contractId,
  );
  const selectedBranch = contract.branches.find((branch: any) => branch.id === value);
  branchAreasList.value = selectedBranch.areas.map((area: any) => {
    return {
      label: `${area.areaCode} - ${area.areaName}`,
      value: area.areaCode,
    };
  });
  setTimeout(() => {
    loadingAreas.value = false;
  }, 500);
};

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
    branch: z.any().optional(),
    area: z.any().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    userName: account?.value.username,
    userEmail: account?.value.email,
    role: account?.value.role,
    contract: account?.value.contract?.contractId || '-',
    branch: account?.value.contract?.branchId || '-',
    area: account?.value.contract?.area || '-',
    status: account?.value.status,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    accountId: account?.value.id,
    username: values.userName,
    password: values.newPassword || '',
    email: values.userEmail,
    role: values.role,
    enabled: accountSituation.value,
    status: values.status,
    contract: {
      contractId: values.contract || '-',
      name: contractName.value || '-',
      branchId: values.branch || '-',
      area: values.area || '-',
    },
    avatar: {
      name: '',
      url: '',
    },
  };

  try {
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
          <CardHeader class="gap-6">
            <div class="md:max-w-[350px] w-full">
              <h3 class="mb-4 text-lg font-bold">Status</h3>
              <FormField v-slot="{ componentField }" name="status">
                <FormItem>
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
            <div class="md:max-w-[350px] w-full">
              <h3 class="mb-4 text-lg font-bold">Tipo de acesso</h3>
              <FormField v-slot="{ componentField }" name="role">
                <FormItem>
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
          </CardHeader>
          <CardContent>
            <div class="mb-6 flex flex-col md:grid md:grid-cols-3 gap-10">
              <div v-if="checkUserRole" class="md:max-w-[350px]">
                <h3 class="mb-4 text-lg font-bold">Editar Filial</h3>
                <FormField v-slot="{ componentField }" name="branch">
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="branchesList"
                        :label="'Selecione'"
                        @on-select="getBranchAreas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
              <div v-if="checkUserRole" class="md:max-w-[350px]">
                <h3 class="mb-4 text-lg font-bold">Editar Centro de Custo</h3>
                <div v-if="loadingAreas" class="p-2 bg-white rounded-md">
                  <LoaderCircle class="animate-spin" />
                </div>
                <div
                  v-if="!loadingAreas && !branchAreasList.length"
                  class="bg-zinc-300 rounded-md h-10 cursor-not-allowed"
                ></div>
                <FormField
                  v-if="!loadingAreas && branchAreasList.length"
                  v-slot="{ componentField }"
                  name="area"
                >
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="branchAreasList"
                        :label="'Selecione'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </div>

            <div class="p-4 border border-zinc-900 rounded-md">
              <h3 class="mb-4 text-lg font-bold">Dados do usuário</h3>
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
                          :disabled="false"
                        />
                        <EyeOff
                          class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                          @click.prevent="revealPassword"
                        />
                      </div>
                      <div v-else class="relative">
                        <Input
                          type="password"
                          placeholder="Insira a senha"
                          v-bind="componentField"
                          :disabled="false"
                        />
                        <Eye
                          class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
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
