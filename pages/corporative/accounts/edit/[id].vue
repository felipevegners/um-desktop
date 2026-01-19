<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { rolesList, userRestrictions } from '@/config/roles';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, LoaderCircle, UserPen, WandSparkles } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { generatePassword } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
});

defineOptions({
  name: 'Backoffice - Editar Conta de Usuário | Urban Mobi',
});

const route = useRoute();
const { toast } = useToast();
const { data } = useAuth();
//@ts-ignore
const role = data.value?.user?.role;

const accountSituation = ref<boolean>(false);
const loadingDelete = ref<boolean>(false);
const viewPassword = ref<boolean>(true);
const contractName = ref<any>(null);
const rolesSelectList = ref<Array<{ label: string; value: string }>>(rolesList);
const userManagerBranches = ref<any>([]);

const contractsStore = useContractsStore();
const { getContractByIdAction } = contractsStore;
const { contract } = storeToRefs(contractsStore);

const accountStore = useAccountStore();
const {
  getUsersAccountsAction,
  deleteUserAccountAction,
  getUsersAccountsByIdAction,
  updateUserAccountAction,
  isLoading,
} = accountStore;
const { isLoadingSend, account } = storeToRefs(accountStore);

await getUsersAccountsByIdAction(route?.params?.id as string);
accountSituation.value = account?.value?.enabled;

const contractRoles = [
  'master-manager',
  'branch-manager',
  'platform-admin',
  'platform-corp-user',
  'admin',
];

onMounted(async () => {
  if (contractRoles.includes(account.value.role)) {
    await getContractByIdAction(account.value.contract.contractId);
    contractName.value = contract?.value.customerName;
  }

  // Initialize userManagerBranches from user's existing branches data
  if (
    account.value.contract?.branches &&
    Array.isArray(account.value.contract.branches)
  ) {
    // User already has branches array in the payload
    userManagerBranches.value = account.value.contract.branches.map((branch: any) => ({
      id: branch.id,
      branchCode: branch.branchCode,
      fantasyName: branch.fantasyName,
    }));
  }

  rolesSelectList.value = rolesList.filter(
    (role) =>
      role.value !== 'admin' &&
      role.value !== 'platform-user' &&
      role.value !== 'platform-driver',
  );
});

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

// const deleteUserAccount = async () => {
//   loadingDelete.value = true;
//   try {
//     await deleteUserAccountAction(route.params.id as string);
//     loadingDelete.value = false;
//     toast({
//       title: 'Tudo pronto!',
//       class: 'bg-green-600 border-0 text-white text-2xl',
//       description: `Conta de Usuário removida com sucesso!`,
//     });
//     await getUsersAccountsAction();
//     setTimeout(() => {
//       navigateTo('/corporative/accounts/active');
//     }, 1000);
//   } catch (error) {
//     toast({
//       title: 'Opss!',
//       class: 'bg-red-500 border-0 text-white text-2xl',
//       description: `Ocorreu um erro ao remover a conta de usuário. Tente novamente.`,
//     });
//     throw error;
//   }
// };

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
    phone: z.string(),
    position: z.string(),
    department: z.string(),
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
    phone: account?.value.phone,
    position: account?.value.position,
    department: account?.value.department,
    contract: account?.value.contract?.contractId,
    branch: account?.value.contract?.branchId,
    area: account?.value.contract?.area,
    status: account?.value.status,
  },
});

const handleGeneratePassword = () => {
  const randomPassword = generatePassword();
  if (randomPassword.length) {
    form.setValues({
      newPassword: randomPassword,
    });
  }
};

const handleUserBranches = (checked: boolean, branch: any) => {
  if (checked) {
    // Add branch to the array if checked
    const branchExists = userManagerBranches.value.some((b: any) => b.id === branch.id);
    if (!branchExists) {
      userManagerBranches.value.push({
        id: branch.id,
        branchCode: branch.branchCode,
        fantasyName: branch.fantasyName,
      });
    }
  } else {
    // Remove branch from the array if unchecked
    userManagerBranches.value = userManagerBranches.value.filter(
      (b: any) => b.id !== branch.id,
    );
  }
};

const isBranchSelected = (branchId: string) => {
  return userManagerBranches.value.some((b: any) => b.id === branchId);
};

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    accountId: account?.value.id,
    username: values.userName,
    password: values.newPassword,
    email: values.userEmail,
    role: values.role,
    enabled: accountSituation.value,
    status: values.status,
    phone: values.phone,
    position: values.position,
    department: values.department,
    contract: {
      ...account.value.contract,
      contractId: values.contract,
      name: contractName.value,
      branchId: values.branch,
      branches: userManagerBranches.value,
      area: values.area,
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
    navigateTo('/corporative/accounts/active');
  }
});

const toggleRestriction = (account: Account, restrictionId: string) => {
  if (!account.contract.restrictions) {
    account.contract.restrictions = [];
  }
  const idx = account.contract.restrictions.indexOf(restrictionId);
  if (idx === -1) {
    account.contract.restrictions.push(restrictionId);
  } else {
    account.contract.restrictions.splice(idx, 1);
  }
};
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
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
        <!-- <Button variant="destructive" @click="deleteUserAccount">
          <Trash class="w-4 h-4" /> Excluir Usuário
        </Button> -->
      </div>
    </section>
    <section
      v-if="isLoading"
      class="p-6 flex items-center justify-center min-h-[300px] rounded-lg bg-zinc-200"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else>
      <form @submit="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardHeader class="gap-6">
            <div class="p-4 flex items-start justify-between">
              <div class="md:max-w-[250px] w-full">
                <h3 class="mb-4 text-lg font-bold">Tipo de acesso</h3>
                <FormField v-slot="{ componentField }" name="role">
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="rolesSelectList"
                        :label="'Selecione'"
                        :disabled="true"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
              <div>
                <h4 class="mb-2 font-bold">Status</h4>
                <span
                  :class="`mx-auto px-2 flex items-center justify-center h-6 rounded-full text-white text-xs w-fit ${
                    account?.status === 'validated' ? 'bg-green-600' : 'bg-amber-500'
                  }`"
                >
                  {{ account?.status === 'validated' ? 'Validado' : 'Pendente' }}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="p-4 border border-zinc-900 rounded-md">
              <div
                v-if="contractRoles.includes(account.role)"
                class="p-4 mb-6 w-full bg-white rounded-md"
              >
                <p>Contrato</p>
                <h3 class="text-lg font-bold">{{ contractName }}</h3>
              </div>
              <h3 class="mb-4 text-lg font-bold">
                Dados do usuário
                <span
                  v-if="data?.user?.name === account?.username"
                  class="ml-2 py-0.5 px-1.5 rounded-md bg-blue-600 text-white text-xs"
                >
                  Sua conta
                </span>
              </h3>

              <div class="md:grid md:grid-cols-4 gap-6">
                <FormField v-slot="{ componentField }" name="userName">
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'(##) #####-####'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="position">
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="department">
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
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
                          :disabled="isLoadingSend"
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
                          :disabled="isLoadingSend"
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
                <div class="relative flex items-center">
                  <Button
                    class="relative px-2 top-[4px] max-w-[140px]"
                    @click.prevent="handleGeneratePassword"
                  >
                    <WandSparkles class="w-6 h-6" />
                    Gerar Senha
                  </Button>
                </div>
              </div>
              <div
                v-if="
                  contract?.branches?.length &&
                  account.role === 'branch-manager' &&
                  role === 'master-manager'
                "
                class="mt-4 p-4 mb-6 w-full bg-white rounded-md"
              >
                <p>Filiais Gerenciadas por este usuário</p>
                <ul class="my-4 flex items-center gap-4">
                  <li
                    v-for="branch in contract.branches"
                    :key="branch.id"
                    class="p-3 border border-zinc-950 rounded-md flex items-center gap-3"
                  >
                    <Checkbox
                      :checked="isBranchSelected(branch.id)"
                      @update:checked="(checked) => handleUserBranches(checked, branch)"
                    />
                    <p class="font-bold text-xl">
                      {{ branch.branchCode }} - {{ branch.fantasyName }}
                    </p>
                  </li>
                </ul>
              </div>
              <div v-if="role === 'master-manager' || role === 'branch-manager'">
                <h3 class="my-4 font-bold text-lg">Restrições de Atendimento</h3>
                <ul class="space-y-3">
                  <li
                    v-for="restriction in userRestrictions"
                    :key="restriction.id"
                    class="flex items-center gap-2"
                  >
                    <Checkbox
                      :checked="account?.contract?.restrictions?.includes(restriction.id)"
                      @update:checked="toggleRestriction(account, restriction.id)"
                    />
                    <label :for="restriction.id">{{ restriction.label }}</label>
                  </li>
                </ul>
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
            @click.prevent="navigateTo('/corporative/accounts/active')"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
