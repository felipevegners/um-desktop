<script setup lang="ts">
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

const route = useRoute();
const { toast } = useToast();
const { data } = useAuth();

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

// Determinar quais campos são obrigatórios baseado na mode
const isAdminMode = props.mode === 'admin';
const isCorporativeMode = props.mode === 'corporative';
const isPersonalMode = props.mode === 'personal';

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

  let accountData: any = {
    accountId: account.value.id as string,
  };

  if (isPersonalMode) {
    accountData = {
      ...accountData,
      username: values.username,
      password: values.newPassword ? values.newPassword : '',
      email: values.email,
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
        contractId: values.contract,
        branchId: values.branch,
        area: values.area,
        branches: userManagerBranches.value,
      },
      restrictions:
        account.value?.contract?.restrictions || userRestrictions.map((item) => item.id),
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
          <Card class="bg-zinc-200">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <UserPen />
                {{
                  isAdminMode
                    ? 'Editar Conta de Usuário'
                    : 'Gerenciar Usuário Corporativo'
                }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-8">
              <section>
                <h2 class="mb-6 text-lg font-bold">Informações Básicas</h2>
                <div class="mb-4 w-full grid grid-cols-3 gap-8">
                  <FormField v-slot="{ componentField }" name="userName">
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
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
                        <Input type="email" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
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
                </div>
              </section>

              <section>
                <h2 class="mb-6 text-lg font-bold">Credenciais e Acesso</h2>
                <div class="mb-4 w-full grid grid-cols-3 gap-8">
                  <FormField v-slot="{ componentField }" name="role">
                    <FormItem>
                      <FormLabel>Perfil/Função</FormLabel>
                      <FormControl>
                        <select v-bind="componentField" class="border rounded-md p-2">
                          <option value="">Selecione um perfil</option>
                          <option
                            v-for="role in isAdminMode
                              ? rolesList
                              : rolesList.filter(
                                  (r) =>
                                    r.value !== 'admin' &&
                                    r.value !== 'platform-user' &&
                                    r.value !== 'platform-driver',
                                )"
                            :key="role.value"
                            :value="role.value"
                          >
                            {{ role.label }}
                          </option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="status">
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select v-bind="componentField" class="border rounded-md p-2">
                          <option value="pending">Pendente</option>
                          <option value="validated">Validado</option>
                          <option value="rejected">Rejeitado</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
                <div class="mb-4 w-full grid grid-cols-3 gap-8">
                  <FormField v-slot="{ componentField }" name="newPassword">
                    <FormItem class="col-span-2">
                      <FormLabel>Nova Senha</FormLabel>
                      <div class="flex gap-2">
                        <FormControl class="flex-1">
                          <Input
                            :type="viewPassword ? 'password' : 'text'"
                            v-bind="componentField"
                            placeholder="Deixe em branco para manter a atual"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          @click="revealPassword"
                        >
                          <Eye v-if="viewPassword" :size="20" />
                          <EyeOff v-else :size="20" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          @click="handleGeneratePassword"
                        >
                          <WandSparkles :size="20" />
                          Gerar
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </section>

              <section v-if="contractRoles.includes(account?.role || '')">
                <h2 class="mb-6 text-lg font-bold">Informações do Contrato</h2>
                <div class="mb-4 w-full grid grid-cols-2 gap-8">
                  <FormField v-slot="{ componentField }" name="contract">
                    <FormItem>
                      <FormLabel>Contrato</FormLabel>
                      <FormControl>
                        <Input type="text" :value="contractName" disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="area">
                    <FormItem>
                      <FormLabel>Área</FormLabel>
                      <FormControl>
                        <Input type="text" v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </div>
              </section>

              <section>
                <h2 class="mb-6 text-lg font-bold">Informações Adicionais</h2>
                <div class="mb-4 w-full grid grid-cols-2 gap-8">
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

              <section v-if="isAdminMode">
                <h2 class="mb-6 text-lg font-bold">Confirmações</h2>
                <div class="space-y-4">
                  <FormField
                    v-slot="{ value, handleChange }"
                    name="emailConfirmed"
                    type="checkbox"
                  >
                    <FormItem class="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox @update:checked="handleChange" :checked="value" />
                      </FormControl>
                      <FormLabel class="font-normal">E-mail Confirmado</FormLabel>
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ value, handleChange }"
                    name="acceptTerms"
                    type="checkbox"
                  >
                    <FormItem class="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox @update:checked="handleChange" :checked="value" />
                      </FormControl>
                      <FormLabel class="font-normal">Aceitar Termos</FormLabel>
                    </FormItem>
                  </FormField>
                </div>
              </section>

              <section
                class="flex items-center gap-2 p-4 bg-yellow-100 border border-yellow-300 rounded-md"
              >
                <Checkbox v-model="accountSituation" />
                <label>{{ accountSituation ? 'Conta Ativa' : 'Conta Inativa' }}</label>
              </section>
            </CardContent>
          </Card>
        </template>

        <div class="mt-6 flex justify-end gap-4">
          <FormButtons
            cancel="/profile/me"
            :loading="isLoadingSend"
            sbm-label="Salvar Alterações"
            cnc-label="Cancelar"
          />
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
