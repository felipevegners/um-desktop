<script setup lang="ts">
import BranchForm from '@/components/forms/BranchForm.vue';
import BackLink from '@/components/shared/BackLink.vue';
import { useToast } from '@/components/ui/toast';
import { toTypedSchema } from '@vee-validate/zod';
import { FileText, LoaderCircle, Trash } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import AddressForm from '~/components/forms/AddressForm.vue';
import { useBranchesStore } from '~/stores/branches.store';
import { useContractsStore } from '~/stores/contracts.store';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Editar Filial | Urban Mobi',
});

const { toast } = useToast();
const { data } = useAuth();
//@ts-ignore
const contractId = data.value?.user.contract?.contractId;
//@ts-ignore
const role = data.value?.user?.role;

const branchStore = useBranchesStore();
const contractStore = useContractsStore();
const { getBranchByIdAction, deleteBranchAction, updateBranchAction } = branchStore;
const { branch, isLoadingData } = storeToRefs(branchStore);
const { getContractByIdAction } = contractStore;
const { contract } = storeToRefs(contractStore);

const route = useRoute();
await getBranchByIdAction(route?.params?.id as string);
await getContractByIdAction(branch.value.contractId as string);

const branchSituation = ref<boolean>(true);
branchSituation.value = branch?.value.enabled;
const ccAreas = ref();
ccAreas.value = branch?.value.areas;

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
    // TODO: pass to dynamic schema
    branchManagerName: z.string().optional(),
    branchManagerPhone: z.string().optional(),
    branchManagerPosition: z.string().optional(),
    branchManagerDepartment: z.string().optional(),
    branchBudget: z.array(
      z
        .number()
        .min(0)
        .max(Number(contract?.value.mainBudget) * 100)
        .optional(),
    ),
    status: z.boolean(),
    managerId: z.string(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    contract: branch?.value.contractId,
    branchCode: branch?.value?.branchCode,
    document: branch?.value.document,
    name: branch?.value.name,
    fantasyName: branch?.value.fantasyName,
    zipcode: branch?.value.address.zipcode,
    streetName: branch?.value.address.streetName,
    streetNumber: branch?.value.address.streetNumber,
    complement: branch?.value.address.complement,
    neighborhood: branch?.value.address.neighborhood,
    city: branch?.value.address.city,
    state: branch?.value.address.state,
    phone: branch?.value.phone,
    phoneExtension: branch?.value.phoneExtension || '-',
    branchManagerName: branch?.value.manager?.username || '-',
    branchManagerPhone: branch?.value.manager?.phone || '-',
    branchManagerPosition: branch?.value.manager?.position || '-',
    branchManagerDepartment: branch?.value.manager?.department || '-',
    branchBudget: [parseFloat(branch?.value.budget)],
    status: branch?.value.status === 'pending' ? false : true,
    managerId: branch?.value.managerId,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const newBranchData = {
    ...values,
    branchId: branch?.value.id,
    areas: [...ccAreas.value],
    branchBudget: values.branchBudget.toString(),
    enabled: branchSituation.value,
    status: values.status === true ? 'validated' : 'pending',
  };
  try {
    await updateBranchAction(newBranchData);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Filial atualizada com sucesso!`,
    });
    navigateTo('/corporative/branches/active');
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao editar a Filial. Tente novamente.`,
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
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <FileText class="w-6 h-6" />
        Editar: {{ branch?.fantasyName }}
      </h1>
      <div v-if="role === 'master-manager'" class="flex gap-12 items-center">
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
    <section>
      <div
        v-if="branch.status === 'pending'"
        class="p-6 my-6 bg-amber-300/50 border border-amber-500 w-full rounded-md flex items-center justify-between"
      >
        <div>
          <Info :size="24" class="mb-2 text-amber-700" />
          <h3 class="mb-6 font-bold text-xl text-amber-700">Dados não validados</h3>
          <p>
            <span class="font-bold"> Atenção: </span>
            O cadastro desta filial encontra-se pendente de confirmação dos dados
            fornecidos.
          </p>
          <p>
            Verifique se todos os dados desta filial estão corretos e assinale abaixo para
            a validação do cadastro. Em caso de inconsistências, edite os dados e salve as
            alterações.
          </p>
        </div>
      </div>
    </section>
    <section v-if="isLoadingData" class="min-h-[300px] flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mt-6">
      <form @submit="onSubmit" @keydown.enter.prevent="true" id="form">
        <Card class="py-6 bg-zinc-200">
          <BranchForm
            :editMode="true"
            :branchData="branch"
            :managerId="branch?.manager?.id || '-'"
            :contractId="branch?.contractId"
            v-model="ccAreas"
            :actualBranchBudget="branch?.budget"
            :form="form"
          >
            <AddressForm :form="form" />
          </BranchForm>
        </Card>

        <div
          v-if="branch.status === 'pending'"
          class="p-6 my-6 bg-amber-300/50 border border-amber-500 hover:bg-amber-300 flex items-start gap-3 rounded-lg has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950"
        >
          <FormField v-slot="{ handleChange }" type="checkbox" name="status">
            <FormItem class="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  @update:checked="handleChange"
                  class="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700 w-6 h-6"
                />
              </FormControl>
              <FormLabel class="font-normal">
                Confirmo que todos os dados cadastrados estão corretos.
              </FormLabel>
            </FormItem>
          </FormField>
        </div>
        <div class="mt-6 flex gap-4">
          <Button type="submit" form="form">
            <LoaderCircle v-if="isLoadingData" class="w-5 h-5 animate-spin" />
            Salvar Alterações
          </Button>
          <Button
            type="button"
            variant="ghost"
            @click="navigateTo('/corporative/branches/active')"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
