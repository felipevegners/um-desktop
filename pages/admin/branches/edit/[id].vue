<script setup lang="ts">
import BranchForm from '@/components/forms/BranchForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { useToast } from '@/components/ui/toast';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { toTypedSchema } from '@vee-validate/zod';
import { FileText, LoaderCircle, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import AddressForm from '~/components/forms/AddressForm.vue';
import { useContractsStore } from '~/stores/admin/contracts.store';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Editar Filial | Urban Mobi',
});

const { toast } = useToast();

const branchStore = useBranchesStore();
const contractStore = useContractsStore();
const { getBranchByIdAction, deleteBranchAction } = branchStore;
const { branch, isLoadingData } = storeToRefs(branchStore);
const { getContractByIdAction } = contractStore;
const { contract } = storeToRefs(contractStore);

const route = useRoute();
await getBranchByIdAction(route?.params?.id as string);
await getContractByIdAction(route?.params?.id as string);

const branchSituation = ref<boolean>(true);
branchSituation.value = branch?.value.enabled;

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
    branchBudget: z.array(
      z.number().min(0).max(parseFloat(contract?.value.mainBudget)),
    ),
  }),
);

const form = useForm({
  // validationSchema: formSchema,
  initialValues: {
    ...branch.value,
    contract: branch?.value.contractId,
    zipcode: branch?.value.address.zipcode,
    streetName: branch?.value.address.streetName,
    streetNumber: branch?.value.address.streetNumber,
    complement: branch?.value.address.complement,
    neighborhood: branch?.value.address.neighborhood,
    city: branch?.value.address.city,
    state: branch?.value.address.state,
    branchManagerName: branch?.value.manager.username,
    branchManagerPhone: branch?.value.managerInfo.phone,
    branchManagerPosition: branch?.value.managerInfo.position,
    branchManagerDepartment: branch?.value.managerInfo.department,
    branchBudget: [branch?.value.budget],
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  console.log('VALUES ---> ', values.branchBudget.toString());
});
</script>
<template>
  <main class="p-6">
    <header>
      <BackLink />
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Editar: {{ branch.branchCode }} - {{ branch.fantasyName }}
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Filial </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativa </Label>
            <Switch
              v-model:checked="branchSituation"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativa </Label>
          </div>
        </div>
        <Button variant="destructive" @click="">
          <Trash class="w-4 h-4" /> Excluir Filial
        </Button>
      </div>
    </section>
    <section
      v-if="isLoadingData"
      class="min-h-[300px] flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <Card class="py-6 bg-zinc-200">
        <form @submit="onSubmit" @keydown.enter.prevent="true" id="form">
          <BranchForm
            :editMode="true"
            :managerId="branch?.manager.id"
            :contractId="branch?.contractId"
            v-model="branch.areas"
            :form="form"
          >
            <AddressForm :form="form" />
          </BranchForm>
          <div class="mt-6 px-6 flex gap-4">
            <Button type="submit" form="form">
              <LoaderCircle v-if="isLoadingData" class="w-5 h-5 animate-spin" />
              Salvar Alterações
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
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
