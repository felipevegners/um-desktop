<script setup lang="ts">
import AdditionalInfoForm from '@/components/forms/AdditionalInfoForm.vue';
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import ServicesForm from '@/components/forms/ServicesForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { useContractsStore } from '@/stores/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import { FileText, LoaderCircle, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Editar Contrato | Urban Mobi',
});

const store = useContractsStore();
const { getContractByIdAction } = store;
const { contract, isLoading } = storeToRefs(store);

const route = useRoute();
await getContractByIdAction(route?.params?.id as string);

const { toast } = useToast();
const isLoadingAddress = ref<boolean>(false);
const contractStatus = ref<boolean>(true);
const isLoadingSend = ref<boolean>(false);

const MAX_FILE_SIZE = 4000000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const { startUpload } = useUploadThing('customerLogo', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
});

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
    phoneExtension: z.string().min(2).max(6).optional(),
    website: z.string().min(2).max(50),
    logo: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 4Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg ou .png são aceitos ',
      )
      .optional(),
    managerName: z.string().min(1).max(100),
    managerCellPhone: z.string().min(2).max(16),
    position: z.string().min(1).max(50),
    department: z.string().min(1).max(50),
    managerEmail: z.string().email().min(1).max(100),
    password: z.string().min(8, 'Mínimo de 8 caracteres').max(8),
    paymentTerm: z.string().min(1).max(10),
    paymentDueDate: z.number().min(0),
    additionalInfo: z.string().min(1).max(200).optional(),
  }),
);

const form = useForm({
  validationSchema: schema,
  initialValues: {
    document: contract?.value?.customer.document,
    name: contract?.value?.customer.name,
    fantasyName: contract?.value?.customer.fantasyName,
    zipcode: contract?.value?.customer.address.zipcode,
    streetName: contract?.value?.customer.address.streetName,
    streetNumber: contract?.value?.customer.address.streetNumber,
    complement: contract?.value?.customer.address.complement,
    neighborhood: contract?.value?.customer.address.neighborhood,
    city: contract?.value?.customer.address.city,
    state: contract?.value?.customer.address.state,
    phone: contract?.value?.customer.phone,
    phoneExtension: contract?.value?.customer.phoneExtension,
    website: contract?.value?.customer.website,
    // logo: contract?.value?.customer.logo.name,
    managerName: contract?.value?.managerName,
    managerCellPhone: contract?.value?.manager.phone,
    position: contract?.value?.manager.position,
    department: contract?.value?.manager.department,
    managerEmail: contract?.value?.manager.email,
    password: contract?.value?.manager.password,
    paymentTerm: contract?.value?.comercialConditions.paymentTerm,
    paymentDueDate: contract?.value?.comercialConditions.paymentDueDate,
    additionalInfo: contract?.value?.additionalInfo,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  // const files = [values?.logo];
  // try {
  //   if (!files) return;
  //   const filesResponse = await startUpload(files);
  //   values.logo = {
  //     //@ts-ignore
  //     name: filesResponse[0]?.name || '',
  //     //@ts-ignore
  //     url: filesResponse[0]?.ufsUrl || '',
  //   };
  //   isLoadingSend.value = !isLoadingSend.value;
  //   await createContractAction(values);
  // } catch (error) {
  //   toast({
  //     title: 'Opss!',
  //     class: 'bg-red-500 border-0 text-white text-2xl',
  //     description: `Ocorreu um erro ao cadastrar o contrato. Tente novamente.`,
  //   });
  // } finally {
  //   isLoadingSend.value = !isLoadingSend.value;
  //   toast({
  //     title: 'Tudo pronto!',
  //     class: 'bg-green-600 border-0 text-white text-2xl',
  //     description: `Contrato cadastrado com sucesso!`,
  //   });
  //   navigateTo('/admin/contracts/active');
  // }
});

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
        <div class="">
          <Label class="text-md font-bold"> Status do Contrato </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="contractStatus"
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
      <section
        v-if="isLoading"
        class="min-h-[300px] flex items-center justify-center"
      >
        <LoaderCircle class="w-10 h-10 animate-spin" />
      </section>
      <section v-else>
        <form @submit="onSubmit">
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">1. Dados do Cliente</h2>
            <CompanyForm
              :findAddress="findAddress"
              :loading="isLoadingAddress"
            />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">2. Gestor Master</h2>
            <MasterManagerForm />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">
              3. Condições Comerciais
            </h2>
            <ComercialConditionsForm />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">4. Serviços e Tarifas</h2>
            <ServicesForm />
          </div>
          <div class="mb-10">
            <h2 class="px-6 mb-4 text-2xl font-bold">
              5. Informações Adicionais
            </h2>
            <AdditionalInfoForm />
          </div>
          <div class="px-6 flex gap-6">
            <Button type="submit">
              <LoaderCircle v-if="isLoadingSend" class="w-5 h-5 animate-spin" />
              Salvar Contrato
            </Button>
            <Button type="button" variant="ghost"> Cancelar </Button>
          </div>
        </form>
      </section>
    </Card>
  </main>
</template>

<style scoped></style>
