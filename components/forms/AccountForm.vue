<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { rolesList, userRestrictions } from '@/config/roles';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, LoaderCircle, Trash, UserPen, WandSparkles } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { generatePassword } from '~/lib/utils';

import AddressForm from './AddressForm.vue';

interface Props {
  accountId: string;
  mode: 'admin' | 'corporative' | 'personal';
  isAdminEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isAdminEditing: false,
});

const { toast } = useToast();
const { data } = useAuth();
const currentUserRole = computed(() => String((data.value as any)?.user?.role || ''));

const accountSituation = ref<boolean>(false);
const loadingDelete = ref<boolean>(false);
const viewPassword = ref<boolean>(true);
const contractName = ref<any>(null);
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

await getUsersAccountsByIdAction(props.accountId);
accountSituation.value = !!account.value?.enabled;

const contractRoles = [
  'master-manager',
  'branch-manager',
  'platform-admin',
  'platform-corp-user',
  'admin',
];

onMounted(async () => {
  if (contractRoles?.includes(account.value?.role || '')) {
    const contractId = account.value?.contract?.contractId;
    if (contractId) {
      await getContractByIdAction(contractId);
    }
    contractName.value = contract?.value.customerName;

    if (
      account.value.contract?.branches &&
      Array.isArray(account.value.contract.branches)
    ) {
      userManagerBranches.value = account.value.contract.branches.map((branch: any) => ({
        id: branch.id,
        branchCode: branch.branchCode,
        fantasyName: branch.fantasyName,
      }));
    }
  }
});

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const deleteUserAccount = async () => {
  loadingDelete.value = true;
  try {
    await deleteUserAccountAction(props.accountId);
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
    const branchExists = userManagerBranches.value.some((b: any) => b.id === branch.id);
    if (!branchExists) {
      userManagerBranches.value.push({
        id: branch.id,
        branchCode: branch.branchCode,
        fantasyName: branch.fantasyName,
      });
    }
  } else {
    userManagerBranches.value = userManagerBranches.value.filter(
      (b: any) => b.id !== branch.id,
    );
  }
};

const isBranchSelected = (branchId: string) => {
  return userManagerBranches.value.some((b: any) => b.id === branchId);
};

const toggleRestriction = (restrictionId: string) => {
  if (!account.value?.contract) {
    return;
  }

  if (!Array.isArray(account.value.contract.restrictions)) {
    account.value.contract.restrictions = [];
  }

  const idx = account.value.contract.restrictions.indexOf(restrictionId);
  if (idx === -1) {
    account.value.contract.restrictions.push(restrictionId);
  } else {
    account.value.contract.restrictions.splice(idx, 1);
  }
};

// Determinar quais campos são obrigatórios baseado na mode
const isAdminMode = props.mode === 'admin';
const isCorporativeMode = props.mode === 'corporative';
const isPersonalMode = props.mode === 'personal';

const roleHierarchy: Record<string, number> = {
  admin: 5,
  'master-manager': 4,
  'branch-manager': 3,
  'platform-admin': 2,
  'platform-corp-user': 1,
  'platform-user': 1,
  'platform-driver': 1,
};

const editableRolesByActor: Record<string, string[]> = {
  admin: rolesList.map((item) => item.value),
  'master-manager': [
    'master-manager',
    'branch-manager',
    'platform-admin',
    'platform-corp-user',
  ],
  'branch-manager': ['branch-manager', 'platform-admin', 'platform-corp-user'],
  'platform-admin': ['platform-admin', 'platform-corp-user'],
  'platform-corp-user': ['platform-corp-user'],
};

const canEditTargetAccount = computed(() => {
  if (!account.value?.role) {
    return true;
  }

  if (isAdminMode) {
    return true;
  }

  const editorRank = roleHierarchy[currentUserRole.value] || 0;
  const targetRank = roleHierarchy[account.value.role] || 0;
  return editorRank >= targetRank;
});

const rolesSelectList = computed(() => {
  if (isAdminMode) {
    return rolesList;
  }

  if (!isCorporativeMode) {
    return [];
  }

  const allowedRoles = editableRolesByActor[currentUserRole.value] || [];
  const filteredRoles = rolesList.filter((item) => allowedRoles.includes(item.value));
  const currentTargetRole = account.value?.role;
  const hasCurrentRoleInList = filteredRoles.some(
    (item) => item.value === currentTargetRole,
  );

  if (!currentTargetRole || hasCurrentRoleInList) {
    return filteredRoles;
  }

  const currentRoleOption = rolesList.find((item) => item.value === currentTargetRole);
  return currentRoleOption ? [currentRoleOption, ...filteredRoles] : filteredRoles;
});

const canChangeTargetRole = computed(() => {
  if (!canEditTargetAccount.value) {
    return false;
  }

  if (isAdminMode) {
    return true;
  }

  return ['master-manager'].includes(currentUserRole.value);
});

const canManageBranchAssignments = computed(() => {
  const targetRole = account.value?.role || '';
  const editorRole = currentUserRole.value;
  const canSeeByTargetRole = ['branch-manager', 'platform-admin'].includes(targetRole);
  const canManageByEditorRole = ['admin', 'master-manager'].includes(editorRole);

  return (
    !!contract?.value?.branches?.length && canSeeByTargetRole && canManageByEditorRole
  );
});

const canManageRestrictions = computed(() => {
  return (
    isAdminMode || ['master-manager', 'branch-manager'].includes(currentUserRole.value)
  );
});

let baseSchema: any = {
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
};

// Adicionar campos de endereço se personal mode
if (isPersonalMode) {
  baseSchema = {
    ...baseSchema,
    username: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    email: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    phone: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    document: z.string({ message: 'Obrigatório!' }).min(2).max(14),
    birthDate: z.any().optional(),
    zipcode: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    streetName: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    streetNumber: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    complement: z.string().min(0).max(50).optional(),
    neighborhood: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    city: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    state: z.string({ message: 'Obrigatório!' }).min(2).max(50),
    oldPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, { message: 'Mínimo 6 caracteres' })
      .max(8, { message: 'Máximo 8 caracteres' })
      .optional(),
  };
}

if (isAdminMode) {
  baseSchema = {
    ...baseSchema,
    emailConfirmed: z.boolean().optional(),
    acceptTerms: z.boolean().optional(),
  };
}

const formSchema = toTypedSchema(z.object(baseSchema));

const initialValues: any = {
  userName: account.value.username,
  userEmail: account.value.email,
  role: account.value.role,
  phone: account.value.phone,
  position: account.value.position,
  department: account.value.department,
  contract: account.value.contract?.contractId,
  branch: account.value.contract?.branchId,
  area: account.value.contract?.area,
  status: account.value.status,
};

if (isPersonalMode) {
  initialValues.username = account.value.username;
  initialValues.email = account.value.email;
  initialValues.document = (account.value as any)?.document;
  initialValues.birthDate = account.value.birthDate;
  initialValues.zipcode = account.value.address?.zipcode;
  initialValues.streetName = account.value.address?.streetName;
  initialValues.streetNumber = account.value.address?.streetNumber;
  initialValues.complement = account.value.address?.complement;
  initialValues.neighborhood = account.value.address?.neighborhood;
  initialValues.city = account.value.address?.city;
  initialValues.state = account.value.address?.state;
}

const form = useForm({
  validationSchema: formSchema,
  initialValues,
});

const isCorpAccount = computed(() => {
  const corpRoles = [
    'master-manager',
    'branch-manager',
    'platform-admin',
    'platform-corp-user',
  ];
  return corpRoles.includes(account.value?.role || '');
});

const onSubmit = form.handleSubmit(async (values) => {
  if (!account.value?.id) {
    toast({
      title: 'Oops!',
      description: 'Conta não encontrada para edição.',
      variant: 'destructive',
    });
    return;
  }

  if (!canEditTargetAccount.value) {
    toast({
      title: 'Oops!',
      description: 'Você não pode editar usuários com nível de acesso superior ao seu.',
      variant: 'destructive',
    });
    return;
  }

  let accountData: any = {
    accountId: account.value.id as string,
  };

  if (isPersonalMode) {
    accountData = {
      ...accountData,
      username: values.username,
      password: values.newPassword ? values.newPassword : '',
      email: values.email,
      role: account.value.role,
      phone: values.phone,
      enabled: accountSituation.value,
      address: {
        zipcode: values.zipcode,
        streetName: values.streetName,
        streetNumber: values.streetNumber,
        complement: values.complement,
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state,
      },
      birthDate: values.birthDate,
      status: 'validated',
      position: isCorpAccount ? values.position : '-',
      department: isCorpAccount ? values.department : '-',
    };

    if (values.newPassword && values.oldPassword === values.newPassword) {
      form.setFieldError(
        'newPassword',
        'As senhas são iguais, verifique e tente novamente!',
      );
      toast({
        title: 'Oops!',
        description: `A senha atual é igual a nova senha. Verifique e tente novamente!`,
        variant: 'destructive',
      });
      return;
    }
  } else {
    // Admin e Corporative mode
    accountData = {
      ...accountData,
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
        area: values.area,
        branches: userManagerBranches.value,
        restrictions: account.value?.contract?.restrictions || [],
      },
    };

    if (isAdminMode) {
      accountData.emailConfirmed = values.emailConfirmed || false;
      accountData.acceptTerms = values.acceptTerms || false;
    }
  }

  try {
    await updateUserAccountAction(accountData);
    toast({
      title: 'Sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Conta de usuário atualizada com sucesso!`,
    });
    navigateTo('/profile/me');
  } catch (error) {
    toast({
      title: 'Oops!',
      description: `Ocorreu um erro ao atualizar a conta.`,
      variant: 'destructive',
    });
  }
});
</script>

<template>
  <div class="w-full">
    <section
      v-if="isLoading"
      class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else>
      <form @submit.prevent="onSubmit">
        <!-- PERSONAL MODE -->
        <template v-if="isPersonalMode">
          <Card class="bg-zinc-200">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <UserPen />
                Minha Conta
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-8">
              <section>
                <h2 class="mb-6 text-lg font-bold">Dados Pessoais</h2>
                <div class="mb-4 w-full grid grid-cols-3 gap-8">
                  <FormField v-slot="{ componentField }" name="username">
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="email">
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" v-bind="componentField" />
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
                  <FormField v-slot="{ componentField }" name="document">
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          v-bind="componentField"
                          v-maska="'###.###.###-##'"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="birthDate">
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </section>

              <section>
                <h2 class="mb-6 text-lg font-bold">Endereço</h2>
                <AddressForm :edit-mode="false" :form="form" />
              </section>

              <section v-if="isCorpAccount">
                <h2 class="mb-6 text-lg font-bold">Dados Corporativos</h2>
                <div class="mb-4 w-full grid grid-cols-3 gap-8">
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
                </div>
              </section>

              <section>
                <h2 class="mb-6 text-lg font-bold">Senha de Acesso</h2>
                <div class="mb-4 w-full grid grid-cols-2 gap-8">
                  <FormField v-slot="{ componentField }" name="oldPassword">
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <div class="relative">
                          <Input
                            :type="viewPassword ? 'password' : 'text'"
                            v-bind="componentField"
                            placeholder="Insira sua senha atual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class="absolute right-0"
                            @click="revealPassword"
                          >
                            <Eye v-if="viewPassword" :size="20" />
                            <EyeOff v-else :size="20" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="newPassword">
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          :type="viewPassword ? 'password' : 'text'"
                          v-bind="componentField"
                          placeholder="Insira uma nova senha"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </section>
            </CardContent>
          </Card>
        </template>

        <!-- ADMIN & CORPORATIVE MODE -->
        <template v-else>
          <section class="mb-10 flex items-center justify-between">
            <h1 class="flex items-center gap-2 text-3xl font-bold">
              <UserPen :size="32" />
              {{
                isAdminMode ? 'Editar Conta de Usuário' : 'Gerenciar Usuário Corporativo'
              }}
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
            </div>
          </section>

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
                          :disabled="!canChangeTargetRole"
                        />
                      </FormControl>
                      <FormMessage />
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

              <p
                v-if="!canEditTargetAccount"
                class="mx-4 rounded-md border border-red-300 bg-red-100 p-3 text-red-700"
              >
                Você pode editar apenas usuários com role igual ou abaixo do seu nível.
              </p>
            </CardHeader>
            <CardContent>
              <div class="p-4 border border-zinc-900 rounded-md">
                <div
                  v-if="contractRoles.includes(account?.role || '')"
                  class="p-4 mb-6 w-full bg-white rounded-md"
                >
                  <p>Contrato</p>
                  <h3 class="text-lg font-bold">{{ contractName }}</h3>
                </div>

                <h3 class="mb-4 text-lg font-bold">Dados do usuário</h3>
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
                  v-if="canManageBranchAssignments"
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

                <div v-if="canManageRestrictions">
                  <h3 class="my-4 font-bold text-lg">Restrições de Atendimento</h3>
                  <ul class="space-y-3">
                    <li
                      v-for="restriction in userRestrictions"
                      :key="restriction.id"
                      class="flex items-center gap-2"
                    >
                      <Checkbox
                        :checked="
                          account?.contract?.restrictions?.includes(restriction.id)
                        "
                        @update:checked="toggleRestriction(restriction.id)"
                      />
                      <label :for="restriction.id">{{ restriction.label }}</label>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </template>

        <div class="mt-6 flex justify-start gap-4">
          <Button type="submit" :disabled="!canEditTargetAccount || isLoadingSend">
            <LoaderCircle v-if="isLoadingSend" class="mr-2 h-5 w-5 animate-spin" />
            Salvar Alterações
          </Button>
          <Button
            type="button"
            variant="ghost"
            @click.prevent="navigateTo('/profile/me')"
          >
            Cancelar
          </Button>
          <Button
            v-if="isAdminMode && account?.id"
            type="button"
            variant="destructive"
            :disabled="loadingDelete"
            @click="deleteUserAccount"
          >
            <Trash class="mr-2" :size="20" />
            Deletar Usuário
          </Button>
        </div>
      </form>
    </section>
  </div>
</template>
