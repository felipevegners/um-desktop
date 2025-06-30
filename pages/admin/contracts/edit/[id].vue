<script setup lang="ts">
import AdditionalInfoForm from '@/components/forms/AdditionalInfoForm.vue';
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { toTypedSchema } from '@vee-validate/zod';
import { CircleX, FileText, LoaderCircle, Paperclip, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';
import ProductsForm from '~/components/forms/ProductsForm.vue';
import { useContractsStore } from '~/stores/contracts.store';
import { useFilesStore } from '~/stores/files.store';

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

contractSituation.value = contract?.value.enabled;
selectedProducts.value = contract?.value.products;

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
    managerName: z.string().min(1).max(100),
    managerCellPhone: z.string().min(2).max(16),
    position: z.string().min(1).max(50),
    department: z.string().min(1).max(50),
    managerEmail: z.string().email().min(1).max(100),
    mainBudget: z.any().optional(),
    paymentTerm: z.string().min(1).max(10),
    paymentDueDate: z.number().min(0),
    additionalInfo: z.string().min(0).max(200).optional(),
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
    managerName: contract?.value?.manager?.username,
    managerCellPhone: contract?.value?.managerInfo?.phone,
    position: contract?.value?.managerInfo?.position,
    department: contract?.value?.managerInfo?.department,
    managerEmail: contract?.value?.manager?.email,
    mainBudget: Number(contract?.value.mainBudget) * 100,
    paymentTerm: contract?.value?.comercialConditions?.paymentTerm,
    paymentDueDate: contract?.value?.comercialConditions?.paymentDueDate,
    additionalInfo: contract?.value?.additionalInfo,
    status: contract?.value?.status,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const payloadIds = {
      contractId: contract?.value.id,
      customerId: contract?.value.customer.id,
      managerId: contract?.value.manager.id,
    };

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
      logo: {
        name: customerLogo.value.name,
        url: customerLogo.value.url,
      },
    };

    const contractData = {
      managerInfo: {
        phone: values.managerCellPhone,
        position: values.position,
        department: values.department,
      },
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

const deleteFile = async (url: string) => {
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Arquivo do logotipo não pode ser removido. Tente novamente.`,
    });
  } finally {
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Arquivo do logotipo foi removido com sucesso!`,
    });
    customerLogo.value.name = '';
    customerLogo.value.url = '';
  }
};

const findAddress = async (code: string) => {
  if (code?.length !== 9) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `CEP inválido. Digite novamente.`,
    });
  } else {
    try {
      isLoadingAddress.value = true;
      const response: any = await findAddressByZipcode(code);
      form.setValues({
        streetName: response.logradouro,
        neighborhood: response.bairro,
        city: response.localidade,
        state: response.estado,
        complement: response.complemento ? response.complemento : '-',
      });
      if (response.erro) {
        toast({
          title: 'CEP Inválido',
          class: 'bg-red-500 border-0 text-white text-2xl',
          description: `Confira o CEP e tente novamente.`,
        });
        //@ts-ignore
        document.querySelector("input[name='zipcode']").focus();
        document
          .querySelector("input[name='zipcode']")
          ?.classList.add(
            'bg-red-300',
            'focus:ring-0',
            'focus-visible:ring-0',
            'focus-visible:outline-3',
            'focus-visible:outline-offset-2',
            'focus-visible:outline-red-500',
          );
      } else {
        document
          .querySelector("input[name='zipcode']")
          ?.classList.remove(
            'bg-red-300',
            'focus-visible:ring-0',
            'focus-visible:outline-3',
            'focus-visible:outline-offset-2',
            'focus-visible:outline-red-500',
          );
      }
    } catch (error) {
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Ocorreu um erro ao buscar o endereço. Tente novamente.`,
      });
      console.log('Erro ao buscar endereço -> ', error);
    } finally {
      isLoadingAddress.value = false;
    }
  }
};
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
              <div
                class="p-4 h-[100px] rounded-md bg-white bg-contain bg-no-repeat bg-center"
                :style="{ backgroundImage: `url(${customerLogo?.url})` }"
              />
              <div class="flex items-end justify-between gap-4">
                <div v-if="customerLogo?.name === ''">
                  <UploadButton
                    class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
                    :config="{
                      appearance: {
                        container: '!items-start',
                        allowedContent: '!absolute !top-10',
                      },
                      content: {
                        allowedContent({ ready, fileTypes, isUploading }) {
                          if (ready) return '';
                          if (isUploading) return 'Enviando seu arquivo, aguarde...';
                        },
                      },
                      endpoint: 'customerLogo',
                      onClientUploadComplete: (file) => {
                        customerLogo.name = file[0].name;
                        customerLogo.url = file[0].ufsUrl;
                      },
                      onUploadError: (error) => {
                        toast({
                          title: 'Ooops!',
                          class: 'bg-red-500 border-0 text-white text-2xl',
                          description: `Erro ao enviar o arquivo. Tente novamente. ${error.cause}`,
                        });
                      },
                    }"
                  />
                </div>
                <div v-if="customerLogo?.name !== ''" class="flex gap-2 items-center">
                  <Paperclip class="w-4 h-4 text-zinc-500" />
                  <div
                    class="px-4 py-2 border border-dashed border-zinc-500 rounded-md bg-white"
                  >
                    <a
                      class="underline"
                      :href="customerLogo?.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ customerLogo?.name || 'Nenhum arquivo anexo' }}
                    </a>
                  </div>
                  <LoaderCircle v-if="loadingFileData" class="w-4 h-4 animate-spin" />
                  <CircleX
                    v-else
                    class="w-4 h-4 text-zinc-500 hover:text-red-500 cursor-pointer"
                    @click.prevent="deleteFile(customerLogo?.url)"
                  />
                </div>
              </div>
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
            <CompanyForm
              :findAddress="findAddress"
              :loading="isLoadingAddress"
              :isEditing="true"
              :form="form"
            />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">2. Gestor Master</h2>
            <MasterManagerForm :editMode="true" :editId="contract?.manager?.id" />
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
              Salvar Contrato
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
