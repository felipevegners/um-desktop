<script setup lang="ts">
import AdditionalInfoForm from '@/components/forms/AdditionalInfoForm.vue';
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import ProductsForm from '@/components/forms/ProductsForm.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { useContractsStore } from '@/stores/contracts.store';
import { useFilesStore } from '@/stores/files.store';
import { toTypedSchema } from '@vee-validate/zod';
import { CircleX, FileText, LoaderCircle, Paperclip, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';

const filesStore = useFilesStore();
const { deleteFileAction } = filesStore;

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Backoffice - Editar Contrato | Urban Mobi',
});

const store = useContractsStore();
const { getContractByIdAction, updateContractAction } = store;
const { contract, isLoading } = storeToRefs(store);

const accountsStore = useAccountStore();
const { getUsersAccountsAction } = accountsStore;
const { accounts } = storeToRefs(accountsStore);

const route = useRoute();
await getContractByIdAction(route?.params?.id as string);

const { toast } = useToast();
const isLoadingAddress = ref<boolean>(false);
const contractSituation = ref<boolean>(true);
const isLoadingSend = ref<boolean>(false);
const loadingFileData = ref<boolean>(false);
const customerLogo = ref<any>({
  name: contract?.value?.customer?.logo?.name || '',
  url: contract?.value?.customer?.logo?.url || '',
});
const availableProducts = ref();
const isLoadingProducts = ref<boolean>(false);
const selectedProducts = ref<any>([]);
const masterManagerUserList = ref<any>([]);

contractSituation.value = contract?.value.enabled;
selectedProducts.value = contract?.value.products;

const customerLogoImage = reactive({
  name: contract?.value.customer?.logo?.name || '',
  url: contract?.value.customer?.logo?.url || '',
});

onMounted(async () => {
  if (contract && contract.value.manager === null) {
    await getUsersAccountsAction();
  }
  const findContractUsers = accounts.value.filter(
    (account: any) =>
      account.contract.contractId === (route?.params.id as string) &&
      account.role === 'master-manager',
  );
  masterManagerUserList.value = findContractUsers.map((user: any) => {
    return {
      label: `${user.username} - Gestor Master`,
      value: user.id,
    };
  });
});

const fetchProducts = async () => {
  isLoadingProducts.value = true;
  try {
    return await $fetch('/api/products');
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao carregar os Produtos. Atualize a página.`,
    });
  } finally {
    isLoadingProducts.value = false;
  }
};
availableProducts.value = await fetchProducts();

const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Insira o nome').max(100),
    document: z.string().min(2).max(50),
    fantasyName: z.string().min(2).max(50),
    zipcode: z.string().min(1).max(9),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    phone: z.string().min(2).max(16),
    phoneExtension: z.string().min(0).max(6).optional(),
    website: z.string().min(2).max(50),
    managerName: z.string().min(1).max(100).optional(),
    managerId: z.string().min(1).max(100).optional(),
    managerCellPhone: z.string().min(2).max(16).optional(),
    position: z.string().min(1).max(50).optional(),
    department: z.string().min(1).max(50).optional(),
    managerEmail: z.string().email().min(1).max(100),
    mainBudget: z.any().optional(),
    paymentTerm: z.string().min(1).max(10),
    paymentDueDate: z.number().min(0),
    additionalInfo: z.any().optional(),
    status: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: schema,
  keepValuesOnUnmount: true,
  initialValues: {
    document: contract?.value?.customer?.document,
    name: contract?.value?.customer?.name,
    fantasyName: contract?.value?.customer?.fantasyName,
    zipcode: contract?.value?.customer?.address?.zipcode,
    streetName: contract?.value?.customer?.address?.streetName,
    streetNumber: contract?.value?.customer?.address?.streetNumber,
    complement: contract?.value?.customer?.address?.complement,
    neighborhood: contract?.value?.customer?.address?.neighborhood,
    city: contract?.value?.customer?.address?.city,
    state: contract?.value?.customer?.address?.state,
    phone: contract?.value?.customer?.phone,
    phoneExtension: contract?.value?.customer?.phoneExtension,
    website: contract?.value?.customer?.website,
    managerName: contract?.value?.managerName || '-',
    managerCellPhone: contract?.value?.manager?.phone || '(XX) XXXXX-XXXX',
    position: contract?.value?.manager?.position || '-',
    department: contract?.value?.manager?.department || '-',
    managerEmail: contract?.value?.manager?.email || 'master-manager@email.com',
    mainBudget: Number(contract?.value.mainBudget) * 100,
    paymentTerm: contract?.value?.comercialConditions?.paymentTerm,
    paymentDueDate: contract?.value?.comercialConditions?.paymentDueDate,
    additionalInfo: contract?.value?.additionalInfo,
    status: contract?.value?.status,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const payloadIds = {
    contractId: contract?.value.id,
    customerId: contract?.value.customer.id,
    managerId: contract?.value.managerId || values.managerId,
  };

  // CUSTOMER PAYLOAD
  const customerData = {
    document: values.document,
    name: values.name,
    fantasyName: values.fantasyName,
    address: {
      zipcode: values.zipcode,
      streetName: values.streetName,
      streetNumber: values.streetNumber,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
    },
    phone: values.phone,
    phoneExtension: values.phoneExtension,
    website: values.website,
    logo: { ...customerLogoImage },
  };

  // CONTRACT PAYLOAD
  const { id, customerId, managerId, managerName, ...restContract } = contract?.value;
  const contractData = {
    ...restContract,
    customerName: values.fantasyName,
    //@ts-ignore
    mainBudget: parseFloat(values?.mainBudget?.replace(/,/g, '') * 1000).toString(),
    comercialConditions: {
      paymentTerm: values.paymentTerm,
      paymentDueDate: values.paymentDueDate,
    },
    products: selectedProducts.value,
    additionalInfo: values.additionalInfo,
    enabled: contractSituation.value,
    status: values.status,
  };
  isLoadingSend.value = !isLoadingSend.value;
  try {
    await updateContractAction({
      payloadIds,
      customerData,
      contractData,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao atualizar o contrato. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = !isLoadingSend.value;
    toast({
      title: 'Feito!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Contrato atualizado com sucesso!`,
    });
    navigateTo('/admin/contracts/active');
  }
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Editar Contrato
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Contrato </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="contractSituation"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativo </Label>
          </div>
        </div>
        <Button variant="destructive" @click="">
          <Trash class="w-4 h-4" /> Excluir Contrato
        </Button>
      </div>
    </section>
    <Card class="py-6 bg-zinc-200">
      <section v-if="isLoading" class="min-h-[300px] flex items-center justify-center">
        <LoaderCircle class="w-10 h-10 animate-spin" />
      </section>
      <section v-else>
        <form @submit="onSubmit">
          <div class="mb-10 px-6 flex justify-between items-start gap-4">
            <div class="flex flex-col gap-4">
              <p class="font-bold">Logo</p>
              <AvatarEdit
                v-model="customerLogoImage"
                uploadUrl="customerLogo"
                type="customer-logo"
              />
            </div>
            <FormField v-slot="{ componentField }" name="status">
              <FormItem class="grid grid-cols-2 items-center gap-4">
                <FormLabel class="font-bold">Status do Contrato</FormLabel>
                <FormControl>
                  <FormSelect
                    v-bind="componentField"
                    :items="[
                      {
                        label: 'Validado',
                        value: 'validated',
                      },
                      {
                        label: 'Pendente',
                        value: 'pending',
                      },
                    ]"
                    label="Selecione"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">1. Dados do Cliente</h2>
            <CompanyForm :loading="isLoadingAddress" :isEditing="true" :form="form" />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">2. Gestor Master</h2>
            <div v-if="contract?.manager === null" class="px-6 flex flex-col items-start">
              <div class="my-4 px-4 bg-red-200">
                <small class="text-red-500">
                  *Contrato ainda não possui um Gestor Master atribuído. Selecione um
                  usuário com perfil Gestor Master na lista abaixo.
                </small>
              </div>
              <div class="grid grid-cols-4 gap-6 w-full">
                <FormField v-slot="{ componentField }" name="managerId">
                  <FormItem class="col-span-1">
                    <FormLabel class="font-bold">Selecionar Gestor Master</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="masterManagerUserList"
                        label="Selecione"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
            <MasterManagerForm v-else :editMode="true" :editId="contract?.managerId" />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">3. Condições Comerciais</h2>
            <ComercialConditionsForm />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">4. Produtos e Valores</h2>
            <ProductsForm
              v-model="selectedProducts"
              :products="contract?.products"
              :editMode="true"
            />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">5. Informações Adicionais</h2>
            <AdditionalInfoForm />
          </div>
          <div class="px-6 flex gap-6">
            <Button type="submit">
              <LoaderCircle v-if="isLoadingSend" class="w-5 h-5 animate-spin" />
              Atualizar Contrato
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click.prevent="navigateTo('../active/')"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </section>
    </Card>
  </main>
</template>

<style scoped></style>
