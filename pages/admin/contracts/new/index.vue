<script setup lang="ts">
import AdditionalInfoForm from '@/components/forms/AdditionalInfoForm.vue';
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import ServicesForm from '@/components/forms/ServicesForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { useContractsStore } from '@/stores/contracts.store';
import { toTypedSchema } from '@vee-validate/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
} from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import * as z from 'zod';

const { createContractAction } = useContractsStore();

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Novo Contrato | Urban Mobi',
});

const currentStep = ref<any>(0);
const isLoadingSend = ref<boolean>(false);

const { toast } = useToast();
const isLoadingAddress = ref<boolean>(false);

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
      phoneExtension: z.string().min(2).max(6).optional(),
      website: z.string().min(2).max(50),
      logo: z
        .any()
        .refine(
          (file) => file?.size <= MAX_FILE_SIZE,
          `Tamanho máximo é de 4Mb.`,
        )
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
      password: z.string().min(8, 'Mínimo de 8 caracteres').max(8),
    }),
  ),
  // Comercial Conditions Schema
  toTypedSchema(
    z.object({
      paymentTerm: z.string().min(1).max(10),
      paymentDueDate: z.number().min(0),
    }),
  ),
  // Additional Info
  toTypedSchema(
    z.object({
      additionalInfo: z.string().min(1).max(200).optional(),
    }),
  ),
];

const currentSchema = computed(() => {
  return schemas[currentStep.value];
});

const form = useForm({
  validationSchema: currentSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    //@ts-ignore
    services: [],
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  if (currentStep.value === 4) {
    const files = [values?.logo];
    try {
      if (!files) return;
      const filesResponse = await startUpload(files);
      values.logo = {
        //@ts-ignore
        name: filesResponse[0]?.name || '',
        //@ts-ignore
        url: filesResponse[0]?.ufsUrl || '',
      };
      isLoadingSend.value = !isLoadingSend.value;
      await createContractAction(values);
    } catch (error) {
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Ocorreu um erro ao cadastrar o contrato. Tente novamente.`,
      });
    } finally {
      isLoadingSend.value = !isLoadingSend.value;
      toast({
        title: 'Tudo pronto!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: `Contrato cadastrado com sucesso!`,
      });

      navigateTo('/admin/contracts/active');
    }
  }
  currentStep.value++;
});

function prevStep() {
  if (currentStep.value <= 0) {
    return;
  }
  currentStep.value--;
}

function nextStep() {
  if (currentStep.value === 4) {
    return;
  }
  currentStep.value++;
}

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
            <CompanyForm
              :findAddress="findAddress"
              :loading="isLoadingAddress"
            />
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
            4. Serviços e Tarifas
          </AccordionTrigger>
          <AccordionContent>
            <FormField v-slot="{ componentField }" name="services">
              <ServicesForm v-bind="componentField" />
            </FormField>
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
