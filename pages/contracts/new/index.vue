<script setup lang="ts">
import AdditionalInfoForm from '@/components/forms/AdditionalInfoForm.vue';
import ComercialConditionsForm from '@/components/forms/ComercialConditionsForm.vue';
import CompanyForm from '@/components/forms/CompanyForm.vue';
import MasterManagerForm from '@/components/forms/MasterManagerForm.vue';
import RatingPriceForm from '@/components/forms/RatingPriceForm.vue';
import ServicesForm from '@/components/forms/ServicesForm.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { toTypedSchema } from '@vee-validate/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Search,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { ErrorMessage, Field, Form, useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Novo Contrato | Urban Mobi',
});

const currentStep = ref(0);

const { toast } = useToast();
const isLoadingAddress = ref<boolean>(false);

const MAX_FILE_SIZE = 4000000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const schemas = [
  toTypedSchema(
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
      phoneExtension: z.string().min(2).max(6),
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
  toTypedSchema(
    z.object({
      managerName: z.string().min(1).max(100),
      managerCellPhone: z.string().min(2).max(16),
      position: z.string().min(1).max(50),
      department: z.string().min(1).max(50),
      managerEmail: z.string().email().min(1).max(100),
      password: z.string().min(8).max(8),
    }),
  ),
];

const currentSchema = computed(() => {
  return schemas[currentStep.value];
});

function nextStep(values: any) {
  // if (currentStep.value === 3) {
  //   console.log('Done: ', JSON.stringify(values, null, 2));
  //   return;
  // }
  console.log('CHAMOU!!!', values);
  currentStep.value++;
}

const form = useForm({
  validationSchema: currentSchema,
  keepValuesOnUnmount: true,
});

const onSubmit = form.handleSubmit(async (values) => {
  console.log('Chamou!', values);
  if (currentStep.value === 3) {
    console.log('Done: ', JSON.stringify(values, null, 2));
    return;
  }
});

function prevStep() {
  if (currentStep.value <= 0) {
    return;
  }
  currentStep.value--;
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
    <section class="mb-10 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Adicionar Novo Contrato</h1>
    </section>
    <form @submit="onSubmit" keep-values>
      <Accordion
        type="single"
        class="w-full flex flex-col gap-6"
        collapsible
        :default-value="currentStep"
        v-model="currentStep"
      >
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
              :find-address="findAddress"
              :loading="isLoadingAddress"
            />
          </AccordionContent>
        </AccordionItem>
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
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 3 ? 'bg-um-primary' : ''"
          :value="3"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            4. Serviços do Contrato
          </AccordionTrigger>
          <AccordionContent>
            <ServicesForm />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 4 ? 'bg-um-primary' : ''"
          :value="4"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            5. Tarifas Negociadas
          </AccordionTrigger>
          <AccordionContent>
            <RatingPriceForm />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem
          class="bg-zinc-200 rounded-md"
          :class="currentStep > 5 ? 'bg-um-primary' : ''"
          :value="5"
          disabled
        >
          <AccordionTrigger class="px-6 text-xl font-bold hover:no-underline">
            6. Informações Adicionais
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
        <!-- <Button v-if="currentStep !== 3" type="submit">Next</Button> -->
        <Button
          v-if="currentStep !== 5"
          type="button"
          @click.prevent="nextStep"
        >
          Avançar
          <ArrowRight class="w-5 h-5" />
        </Button>
        <Button v-if="currentStep === 5" type="submit">
          <LoaderCircle v-if="false" class="w-5 h-5 animate-spin" />
          <Check class="w-5 h-5" />
          Finalizar Cadastro
        </Button>
      </div>
    </form>
  </main>
</template>

<style scoped></style>
