<script setup lang="ts">
import BranchForm from '@/components/forms/BranchForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Building2, LoaderCircle } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';

const store = useBranchesStore();
const { createBranchAction } = store;
const { isLoadingData } = storeToRefs(store);

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Nova Filial | Urban Mobi',
});

const { toast } = useToast();
const isLoadingAddress = ref<boolean>(false);
const ccAreas = reactive([{ areaCode: '', areaName: '' }]);

const formSchema = toTypedSchema(
  z.object({
    contract: z.string(),
    branchCode: z.string().min(2, 'Mínimo de 2 caracteres').max(10),
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
    branchManagerName: z.string().min(2).max(50),
    branchManagerPhone: z.string().min(2).max(50),
    branchManagerPosition: z.string().min(2).max(50),
    branchManagerDepartment: z.string().min(2).max(50),
    branchManagerEmail: z.string().min(2).max(50),
    branchBudget: z.string(),
    password: z
      .string()
      .min(6, 'A senha deve conter no mínimo 6 caracteres')
      .max(8),
  }),
);

const form = useForm({
  validationSchema: formSchema,
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

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const newBranchData = {
      ...values,
      areas: [...ccAreas],
    };
    await createBranchAction(newBranchData);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Filial cadastrada com sucesso!`,
    });
    navigateTo('/admin/branches/active');
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar a Filial. Tente novamente.`,
    });
    throw error;
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
        <Building2 class="w-6 h-6" />
        Cadastrar Nova Filial
      </h1>
    </section>
    <section class="py-6 bg-zinc-200 rounded-md">
      <form @submit="onSubmit" @keydown.enter.prevent="true" id="form">
        <div class="flex flex-col gap-10">
          <BranchForm
            :isEditing="false"
            :findAddress="findAddress"
            :loading="isLoadingAddress"
            v-model="ccAreas"
            :disabledFields="!!form.values.contract"
          />
          <div class="mt-6 px-6 flex gap-4">
            <Button type="submit" form="form">
              <LoaderCircle v-if="isLoadingData" class="w-5 h-5 animate-spin" />
              Cadastrar
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click="navigateTo('/admin/branches/active')"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </section>
    <pre>{{ form.values }}</pre>
  </main>
</template>

<style scoped></style>
