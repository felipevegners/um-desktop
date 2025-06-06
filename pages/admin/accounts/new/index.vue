<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { rolesList } from '@/config/roles';
import { useAccountStore } from '@/stores/admin/account.store';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Eye, EyeOff, LoaderCircle, UserPen } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
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
const { registerUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;
const { isLoading } = storeToRefs(contractsStore);

await getContractsAction();

const viewPassword = ref<boolean>(false);
const contractName = ref('');
const contractBranches = ref([]);
const loadingBranches = ref(false);
const loadingAreas = ref(false);
const selectedBranches = ref<any>([]);
const branchAreas = ref<any>([]);
const showForm = ref(false);
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

const formSchema = toTypedSchema(
  z.object({
    userName: z
      .string({ message: 'Obrigatório!' })
      .min(2, 'Mínimo 2 caracteres')
      .max(40, 'Máximo 40 caracteres'),
    userEmail: z.string().min(2, 'Insira um e-mail válido').max(100).email(),
    userPassword: z
      .string({ message: 'Obrigatório!' })
      .min(6, 'Mínimo de 6 caracteres')
      .max(8, 'Máximo de 8 caracteres'),
    role: z.string({ message: 'Selecione o tipo de acesso' }).min(2).max(50),
    phone: z.string({ message: 'Obrigatório!' }).min(2),
    document: z.string({ message: 'Obrigatório!' }).min(2).max(18),
    birthDate: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    contract: z.string().optional(),
    branch: z.string().optional(),
    area: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const resetFormState = () => {
  form.setValues({ role: '', contract: '' });
  contractBranches.value = [];
  selectedBranches.value = [];
  branchAreas.value = [];
  showForm.value = false;
};

const getContractData = (value: string) => {
  if (form.values.role === 'master-manager') {
    showForm.value = true;
  }
  loadingBranches.value = true;

  const filtered = contractsStore.contracts?.find(
    (contract: any) => contract.id === value,
  );
  contractName.value = filtered.customerName;
  selectedBranches.value = filtered.branches;
  contractBranches.value = filtered.branches.map((branch: any) => {
    return {
      label: `${branch.branchCode} - ${branch.name}`,
      value: branch.id,
    };
  });
  setTimeout(() => {
    loadingBranches.value = false;
  }, 500);
};

const getBranchAreas = (value: string) => {
  loadingAreas.value = true;
  const selectedBranch = selectedBranches.value.find(
    (branch: any) => branch.id === value,
  );
  branchAreas.value = selectedBranch.areas.map((area: any) => {
    return {
      label: `${area.areaCode} - ${area.areaName}`,
      value: area.areaCode,
    };
  });
  setTimeout(() => {
    loadingAreas.value = false;
  }, 500);
};

const onSubmit = form.handleSubmit(async (values) => {
  const accountData = {
    username: values.userName,
    password: values.userPassword,
    email: values.userEmail,
    document: values.document || '',
    role: values.role,
    enabled: true,
    status: 'pending',
    phone: values.phone,
    position: values.position,
    department: values.department,
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
          <CardHeader>
            <CardTitle class="mb-4">
              <div class="md:max-w-[350px]">
                <h3 class="mb-4 text-lg font-bold">Tipo de Usuário*</h3>
                <FormField v-slot="{ componentField }" name="role">
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="rolesList"
                        :label="'Selecione'"
                        @on-select="resetFormState"
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="mb-6 flex flex-col md:grid md:grid-cols-3 gap-10">
              <div
                v-if="
                  form.values.role === 'master-manager' ||
                  form.values.role === 'branch-manager' ||
                  form.values.role === 'platform-admin' ||
                  form.values.role === 'platform-corp-user'
                "
                class="md:max-w-[350px]"
              >
                <h3 class="mb-4 text-lg font-bold">Selecione o Contrato</h3>
                <FormField v-slot="{ componentField }" name="contract">
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="sanitizeContracts"
                        :label="'Selecione'"
                        @on-select="getContractData"
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
              <div
                v-if="
                  form.values.role === 'branch-manager' ||
                  form.values.role === 'platform-admin' ||
                  form.values.role === 'platform-corp-user'
                "
                class="md:max-w-[350px]"
              >
                <h3 class="mb-4 text-lg font-bold">Selecione a Filial</h3>
                <div v-if="loadingBranches" class="p-2 bg-white rounded-md">
                  <LoaderCircle class="animate-spin" />
                </div>
                <div
                  v-if="!loadingBranches && !selectedBranches.length"
                  class="bg-zinc-300 rounded-md h-10 cursor-not-allowed"
                ></div>
                <FormField
                  v-if="!loadingBranches && selectedBranches.length"
                  v-slot="{ componentField }"
                  name="branch"
                >
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="contractBranches"
                        :label="'Selecione'"
                        @on-select="getBranchAreas"
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
              <div
                v-if="
                  form.values.role === 'branch-manager' ||
                  form.values.role === 'platform-admin' ||
                  form.values.role === 'platform-corp-user'
                "
                class="md:max-w-[550px]"
              >
                <h3 class="mb-4 text-lg font-bold">Selecione o CC</h3>
                <div v-if="loadingAreas" class="p-2 bg-white rounded-md">
                  <LoaderCircle class="animate-spin" />
                </div>
                <div
                  v-if="!loadingAreas && !branchAreas.length"
                  class="bg-zinc-300 rounded-md h-10 cursor-not-allowed"
                ></div>
                <FormField
                  v-if="!loadingAreas && branchAreas.length"
                  v-slot="{ componentField }"
                  name="area"
                >
                  <FormItem>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="branchAreas"
                        :label="'Selecione'"
                        @on-select="
                          () => {
                            showForm = true;
                          }
                        "
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
            </div>
            <div
              v-if="form.values.contract && showForm"
              class="p-4 border border-zinc-900 rounded-md"
            >
              <h3 class="mb-4 text-lg font-bold">Dados do usuário</h3>
              <div class="md:grid md:grid-cols-4 gap-6">
                <FormField v-slot="{ componentField }" name="userName">
                  <FormItem>
                    <FormLabel>Nome Completo*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>Celular*</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'(##) # ####-####'"
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="position">
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="department">
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="userEmail">
                  <FormItem>
                    <FormLabel>E-mail*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="userPassword">
                  <FormItem class="relative">
                    <FormLabel>Senha*</FormLabel>
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
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
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
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                          @click.prevent="revealPassword"
                        />
                      </div>
                    </FormControl>
                    <small class="text-muted-foreground"
                      >*A senha deve conter de 6 a 8 caracteres</small
                    >
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
            </div>
            <div
              v-if="
                form.values.role === 'admin' ||
                form.values.role === 'platform-user' ||
                form.values.role === 'platform-driver'
              "
              class="p-4 border border-zinc-900 rounded-md"
            >
              <h3 class="mb-4 text-lg font-bold">Dados do usuário</h3>
              <div class="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
                <FormField v-slot="{ componentField }" name="userName">
                  <FormItem>
                    <FormLabel>Nome completo*</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>Celular*</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'(##) ####-####'"
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>CPF*</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        v-bind="componentField"
                        v-maska="'###.###.###-##'"
                      />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="birthDate">
                  <FormItem>
                    <FormLabel>Data Nascimento</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
              <Separator class="my-6 bg-zinc-300" />
              <h3 class="mb-4 text-lg font-bold">Dados de Acesso</h3>
              <div class="md:max-w-[450px] flex flex-col gap-6">
                <FormField v-slot="{ componentField }" name="userEmail">
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage class="text-xs" />
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
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
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
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                          @click.prevent="revealPassword"
                        />
                      </div>
                    </FormControl>
                    <small class="text-muted-foreground">
                      *A senha deve conter de 6 a 8 caracteres
                    </small>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>
        <div class="mt-6 flex gap-4">
          <Button type="submit">
            <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />
            Criar Usuário
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
