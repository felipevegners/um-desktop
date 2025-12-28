<script setup lang="ts">
import AddressForm from '@/components/forms/AddressForm.vue';
import BranchForm from '@/components/forms/BranchForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { useBranchesStore } from '@/stores/branches.store';
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
    branchBudget: z.array(z.number().min(0).max(190000)).optional(),
    password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres').max(8),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    branchBudget: [0],
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const newBranchData = {
    ...values,
    areas: [...ccAreas],
    branchBudget: values?.branchBudget?.toString(),
    usedBudget: '0',
  };
  const result = await createBranchAction(newBranchData);

  if (result.success) {
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Filial cadastrada com sucesso!`,
    });
    setTimeout(() => {
      navigateTo('/admin/branches/active');
    }, 1000);
  } else {
    if (result.statusCode === 409) {
      //@ts-ignore
      document.querySelector("input[name='document']").focus();
      form.setFieldError('document', 'Já existe uma filial com este CNPJ');
    }
    toast({
      title: `Opss, ocorreu um erro ao cadastrar a Filial:`,
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: result.error,
    });
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
    <form @submit="onSubmit" @keydown.enter.prevent="true" id="form">
      <section class="py-6 bg-zinc-200 rounded-md">
        <div class="flex flex-col gap-10">
          <BranchForm
            :editMode="false"
            :loading="isLoadingAddress"
            v-model="ccAreas"
            :disabledFields="!!form.values.contract"
            :form="form"
          >
            <AddressForm :form="form" />
          </BranchForm>
        </div>
      </section>
      <div class="mt-6 flex gap-4">
        <Button type="submit" form="form">
          <LoaderCircle v-if="isLoadingData" class="w-5 h-5 animate-spin" />
          Cadastrar Filial
        </Button>
        <Button
          type="button"
          variant="ghost"
          @click="navigateTo('/admin/branches/active')"
        >
          Cancelar
        </Button>
      </div>
    </form>
  </main>
</template>

<style scoped></style>
