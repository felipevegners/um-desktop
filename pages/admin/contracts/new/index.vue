<script setup lang="ts">
import AdditionalInfoForm from '@/components/forms/AdditionalInfoForm.vue';
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowLeft, ArrowRight, Check, FileText, LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import * as z from 'zod';
import ProductsForm from '~/components/forms/ProductsForm.vue';
import { useContractsStore } from '~/stores/contracts.store';

const { createContractAction } = useContractsStore();

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Novo Contrato | Urban Mobi',
});

const currentStep = ref<any>(0);
const isLoadingSend = ref<boolean>(false);
const availableProducts = ref();
const isLoadingProducts = ref<boolean>(false);
const selectedProducts = reactive([]);

const { toast } = useToast();

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

const MAX_FILE_SIZE = 4000000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const { startUpload } = useUploadThing('customerLogo', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
});

const schemas = [
  toTypedSchema(
    // Company Schema
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
      logo: z
        .any()
        .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 4Mb.`)
        .refine(
          (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
          'Apenas arquivos nos formatos .jpg, .jpeg ou .png são aceitos ',
        )
        .optional(),
    }),
  ),
  // Master Manager Schema
  toTypedSchema(
    z.object({
      managerName: z.string().min(1).max(100),
      managerCellPhone: z.string().min(2).max(16),
      position: z.string().min(1).max(50),
      department: z.string().min(1).max(50),
      managerEmail: z.string().email().min(1).max(100),
      password: z.string().min(6, 'Mínimo de 8 caracteres').max(8, 'Máximo 8 caracteres'),
    }),
  ),
  // Comercial Conditions Schema
  toTypedSchema(
    z.object({
      mainBudget: z.string().optional(),
      paymentTerm: z.string({ message: 'Obrigatório' }).min(1).max(10),
      paymentDueDate: z.number({ message: 'Obrigatório' }).min(0),
    }),
  ),
  // Additional Info
  toTypedSchema(
    z.object({
      additionalInfo: z.string().min(0).max(200).optional(),
    }),
  ),
];

const currentSchema = computed(() => {
  return schemas[currentStep.value];
});

const form = useForm({
  validationSchema: currentSchema,
  keepValuesOnUnmount: true,
});

const onSubmit = form.handleSubmit(async (values) => {
  if (currentStep.value === 4) {
    try {
      isLoadingSend.value = true;
      if (values.logo) {
        const files = [values?.logo];
        const filesResponse = await startUpload(files);
        values.logo = {
          //@ts-ignore
          name: filesResponse[0]?.name || '',
          //@ts-ignore
          url: filesResponse[0]?.ufsUrl || '',
        };
      }
      const newContractData = {
        ...values,
        phoneExtension: values.phoneExtension || '-',
        products: selectedProducts,
        //@ts-ignore
        mainBudget: parseFloat(values.mainBudget?.replace(/,/g, '') * 1000).toString(),
      };
      await createContractAction(newContractData);
      isLoadingSend.value = false;
      toast({
        title: 'Tudo pronto!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: `Contrato cadastrado com sucesso!`,
      });
      navigateTo('/admin/contracts/active');
    } catch (error) {
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Ocorreu um erro ao cadastrar o contrato. Tente novamente.`,
      });
      throw error;
    }
  } else {
    currentStep.value++;
  }
});

function prevStep() {
  if (currentStep.value <= 0) {
    return;
  }
  currentStep.value--;
}
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-10 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText :size="24" />
        Adicionar Novo Contrato
      </h1>
    </section>
    <form @submit="onSubmit" keep-values>
      <Accordion
        type="single"
        class="w-full flex flex-col gap-6"
        collapsible
        :default-value="currentStep"
        v-model="currentStep"
      >
        <!-- @vue-skip -->
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 0 ? 'bg-um-primary' : ''"
          :value="0"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            1. Dados da Empresa Matriz
          </AccordionTrigger>
          <AccordionContent class="mt-4">
            <CompanyForm :form="form" />
          </AccordionContent>
        </AccordionItem>
        <!-- @vue-skip -->
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 1 ? 'bg-um-primary' : ''"
          :value="1"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            2. Gestor Master
          </AccordionTrigger>
          <AccordionContent>
            <MasterManagerForm />
          </AccordionContent>
        </AccordionItem>
        <!-- @vue-skip -->
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 2 ? 'bg-um-primary' : ''"
          :value="2"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            3. Condições Comerciais
          </AccordionTrigger>
          <AccordionContent>
            <ComercialConditionsForm />
          </AccordionContent>
        </AccordionItem>
        <!-- @vue-skip -->
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 3 ? 'bg-um-primary' : ''"
          :value="3"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            4. Produtos e Valores
          </AccordionTrigger>
          <AccordionContent>
            <ProductsForm
              v-model="selectedProducts"
              :products="availableProducts"
              :editMode="false"
            />
          </AccordionContent>
        </AccordionItem>
        <!-- @vue-skip -->
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 4 ? 'bg-um-primary' : ''"
          :value="4"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            5. Informações Adicionais
          </AccordionTrigger>
          <AccordionContent>
            <AdditionalInfoForm />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div
        class="mt-6 mb-10 flex"
        :class="currentStep === 0 ? 'justify-end' : 'justify-between'"
      >
        <Button
          v-if="currentStep !== 0"
          type="button"
          variant="ghost"
          @click="prevStep"
          class="flex-end"
        >
          <ArrowLeft class="w-5 h-5" />
          Voltar
        </Button>
        <Button v-if="currentStep !== 4" type="submit">
          Avançar
          <ArrowRight class="w-5 h-5" />
        </Button>
        <Button v-if="currentStep === 4" type="submit">
          <LoaderCircle v-if="isLoadingSend" class="w-5 h-5 animate-spin" />
          <Check v-else class="w-5 h-5" />
          Finalizar Cadastro
        </Button>
      </div>
    </form>
  </main>
</template>

<style scoped></style>
