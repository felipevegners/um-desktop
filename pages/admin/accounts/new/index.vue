<script setup lang="ts">
import BackLink from '@/components/shared/BackLink.vue';
import DataTable from '@/components/shared/DataTable.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input/Input.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { rolesList } from '@/config/roles';
import { useAccountStore } from '@/stores/account.store';
import { useContractsStore } from '@/stores/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Upload,
  UserPen,
  WandSparkles,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import Papa from 'papaparse';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import DownloadCsvTemplate from '~/components/shared/DownloadCsvTemplate.vue';
import { generatePassword } from '~/lib/utils';

import { columns } from './columns';

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Backoffice - Nova Conta de Usuário | Urban Mobi',
});

const { toast } = useToast();
const router = useRouter();

const accountStore = useAccountStore();
const { registerUserAccountAction } = accountStore;
const { isLoadingSend } = storeToRefs(accountStore);

const contractsStore = useContractsStore();
const { getContractsAction } = contractsStore;
const { isLoading } = storeToRefs(contractsStore);

await getContractsAction();

const viewPassword = ref<boolean>(true);
const contractName = ref('');
const contractBranches = ref([]);
const loadingBranches = ref(false);
const loadingAreas = ref(false);
const selectedBranches = ref<any>([]);
const branchAreas = ref<any>([]);
const showForm = ref(false);

const showUploadCsv = ref<boolean>(false);
const importedUserData = ref<any>([]);
const importedUserDataErrors = ref<any>([]);
const loadingImportingUserData = ref<boolean>(false);

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

const singleUserSchema = toTypedSchema(
  z.object({
    userName: z
      .string({ message: 'Obrigatório!' })
      .min(2, 'Mínimo 2 caracteres')
      .max(40, 'Máximo 40 caracteres'),
    userEmail: z.string().min(2, 'Insira um e-mail válido').max(100).email(),
    userPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, 'A senha deve conter no mínimo 6 caracteres')
      .max(8, 'A senha deve conter no máximo 8 caracteres'),
    role: z.string({ message: 'Selecione o tipo de acesso' }).min(2).max(50),
    phone: z.string({ message: 'Obrigatório!' }).min(2),
    document: z.string({ message: 'Obrigatório!' }).min(2).max(18).optional(),
    birthDate: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    contract: z.string().optional(),
    branch: z.string().optional(),
    area: z.string().optional(),
    emailConfirmed: z.boolean().optional(),
    acceptTerms: z.boolean().optional(),
  }),
);

const form = useForm({
  validationSchema: importedUserData.value.length > 0 ? singleUserSchema : {},
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
      label: `${branch.branchCode} - ${branch.fantasyName}`,
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

  branchAreas.value = selectedBranch.areas?.map((area: any) => {
    return {
      label: `${area.areaCode !== '' ? area.areaCode : '000'} - ${area.areaName !== '' ? area.areaName : 'Todas'}`,
      value: area.areaCode !== '' ? area.areaCode : 'all',
    };
  });
  setTimeout(() => {
    loadingAreas.value = false;
  }, 500);
};

const handleGeneratePassword = () => {
  const randomPassword = generatePassword();
  if (randomPassword.length) {
    form.setValues({
      userPassword: randomPassword,
    });
  }
};

const handleFileUpload = (event: any) => {
  loadingImportingUserData.value = true;
  const file = event.target.files[0];
  if (!file) return; // Exit if no file is selected

  const reader = new FileReader();
  reader.onload = (e) => {
    const csvString: any = e?.target?.result;
    const parsedResult = Papa.parse(csvString, {
      header: true, // Use the first row as object keys
      skipEmptyLines: true, // Ignore blank rows
    });

    if (!parsedResult.data.length) {
      toast({
        title: 'Erro na Importação',
        description: `O arquivo enviado não contém nenhum dado de usuário. Tente novamente!`,
        variant: 'destructive',
      });
    }

    importedUserData.value = parsedResult.data;
    importedUserDataErrors.value = parsedResult.errors;

    setTimeout(() => {
      loadingImportingUserData.value = false;
    }, 1000);
  };
  reader.onerror = (e) => {
    console.error('Error reading file:', e);
    // Implement user-facing error messages here.
    toast({
      title: 'Erro na leitura do arquivo',
      description: `O arquivo contém o seguinte erro: ${e}`,
      variant: 'destructive',
    });
  };
  reader.readAsText(file);
};

const handleCancelImport = () => {
  showUploadCsv.value = false;
  importedUserData.value = [];
};

const onSubmit = form.handleSubmit(async (values) => {
  let singleAccountData = {};

  if (importedUserData.value.length > 0) {
    // Validate that all required fields are filled
    const requiredFields = ['nome', 'email', 'telefone'];
    const invalidRows: number[] = [];

    importedUserData.value.forEach((csvUser: any, index: number) => {
      const hasEmptyField = requiredFields.some(
        (field) => !csvUser[field] || csvUser[field].toString().trim() === '',
      );
      if (hasEmptyField) {
        invalidRows.push(index + 1);
      }
    });

    if (invalidRows.length > 0) {
      toast({
        title: 'Erro de Validação',
        description: `Linhas ${invalidRows.join(', ')} contêm campos obrigatórios vazios (nome, email ou telefone).`,
        variant: 'destructive',
      });
      return;
    }

    const allPromiseUsers = importedUserData.value.map(async (csvUser: any) => {
      const data = {
        username: csvUser.nome,
        password: '123456',
        email: csvUser.email,
        document: values.document || '',
        role: values.role,
        enabled: true,
        status: 'pending',
        phone: csvUser.telefone,
        position: csvUser.cargo,
        department: csvUser.departamento,
        contract: {
          contractId: values.contract || null,
          name: contractName.value || null,
          branchId: values.branch || null,
          area: values.area || null,
          branches: [],
          restrictions: ['week'],
        },
        avatar: {
          name: '',
          url: '',
        },
        acceptTerms: false,
        emailConfirmed: false,
      };
      return await registerUserAccountAction(data);
    });

    try {
      const results = await Promise.all(allPromiseUsers);

      // Check if all were successful
      const successCount = results.filter((r) => r?.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        // All succeeded
        toast({
          title: 'Sucesso!',
          class: 'bg-green-600 border-0 text-white text-2xl',
          description: `${successCount} conta(s) de usuário cadastradas com sucesso!`,
        });
        setTimeout(() => {
          navigateTo('/admin/accounts/active');
        }, 1000);
      } else if (successCount > 0) {
        // Partial success
        toast({
          title: 'Sucesso Parcial',
          class: 'bg-yellow-600 border-0 text-white text-2xl',
          description: `${successCount} conta(s) criada(s), ${failCount} falharam.`,
        });
        setTimeout(() => {
          navigateTo('/admin/accounts/active');
        }, 2000);
      } else {
        // All failed
        toast({
          title: 'Erro ao criar contas de usuário',
          description: 'Todas as criações de conta falharam.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar contas de usuário',
        description: 'Ocorreu um erro durante o processo.',
        variant: 'destructive',
      });
    }
  } else {
    singleAccountData = {
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
        contractId: values.contract || null,
        name: contractName.value || null,
        branchId: values.branch || null,
        area: values.area || null,
        branches: [],
        restrictions: ['week'],
      },
      avatar: {
        name: '',
        url: '',
      },
      acceptTerms: false,
      emailConfirmed: false,
    };
    const result = await registerUserAccountAction(singleAccountData);
    if (result?.success) {
      toast({
        title: 'Sucesso!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: `Conta de Usuário cadastrado com sucesso!`,
      });
      setTimeout(() => {
        navigateTo('/admin/accounts/active');
      }, 1000);
    } else {
      if (result.statusCode === 409) {
        //@ts-ignore
        document.querySelector("input[name='userEmail']").focus();
        form.setFieldError('userEmail', 'Já existe uma conta vinculada a este e-mail!');
      }
      toast({
        title: 'Erro ao criar nova conta de usuário:',
        description: result.error,
        variant: 'destructive',
      });
    }
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
      <h1 class="font-bold text-black text-3xl">Criar Novo Usuário</h1>
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
              <div class="my-10 flex items-center gap-4">
                <div v-if="!showUploadCsv" class="flex items-center gap-4">
                  <Button type="button" @click.prevent="() => (showUploadCsv = true)">
                    <Upload />
                    Importar Dados CSV
                  </Button>
                  <DownloadCsvTemplate title="Baixar template" />
                </div>
                <div v-if="showUploadCsv" class="flex items-start gap-2">
                  <div>
                    <Input
                      type="file"
                      @change="handleFileUpload"
                      accept=".csv"
                      class="max-w-[350px]"
                    />
                    <small class="px-2 text-xs text-muted-foreground">
                      *Apenas arquivo .csv
                    </small>
                  </div>
                  <Button
                    v-if="showUploadCsv"
                    type="button"
                    variant="link"
                    @click.prevent="handleCancelImport"
                  >
                    <X />
                    Cancelar
                  </Button>
                </div>
              </div>
              <div>
                <div
                  v-if="importedUserData.length > 0"
                  class="p-4 flex flex-col items-center justify-center bg-white rounded-md"
                >
                  <LoaderCircle v-if="loadingImportingUserData" class="animate-spin" />
                  <DataTable
                    v-else
                    :data="importedUserData"
                    :columns="columns"
                    :show-column-select="false"
                    :show-filter="false"
                  />
                </div>
              </div>
              <div v-if="!showUploadCsv" class="md:grid md:grid-cols-4 gap-6">
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
                        v-maska="'(##) #####-####'"
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
                          maxlength="8"
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
                          maxlength="8"
                        />
                        <Eye
                          class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                          :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                          @click.prevent="revealPassword"
                        />
                      </div>
                    </FormControl>
                    <small class="text-muted-foreground">
                      *A senha deve conter de 6 a 8 caracteres</small
                    >
                    <FormMessage class="text-xs" />
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
                        v-maska="'(##) #####-####'"
                      />
                      <!--  -->
                    </FormControl>
                    <FormMessage class="text-xs" />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="document">
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
                      <Input type="text" v-bind="componentField" v-maska="'##/##/####'" />
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
            </div>
          </CardContent>
        </Card>
        <div class="mt-6 flex gap-4">
          <Button type="submit">
            <LoaderCircle v-if="isLoadingSend" class="w-6 h-6 animate-spin" />

            {{ importedUserData.length > 0 ? 'Criar Usuários' : 'Criar Usuário' }}
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
