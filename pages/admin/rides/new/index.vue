<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { useBranchesStore } from '@/stores/admin/branches.store';
import { useContractsStore } from '@/stores/admin/contracts.store';
import { CalendarDays, LoaderCircle, MapPin, MapPinCheck } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import GoogleMap from './GoogleMap.vue';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});
useHead({
  title: 'Novo Atendimento | Urban Mobi',
});

const contractsStore = useContractsStore();
const { getContractsAction, getContractByIdAction } = contractsStore;
const { contracts, contract, isLoading } = storeToRefs(contractsStore);

const selectedBranches = ref<any>([]);
const loadingBraches = ref<boolean>(false);

onBeforeMount(async () => {
  await getContractsAction();
});

const sanitizeContracts = computed(() => {
  //@ts-ignore
  return contracts?.value.map((contract: any) => {
    return {
      label: contract.customerName,
      value: contract.id,
    };
  });
});

const getBranches = async (contractId: string) => {
  loadingBraches.value = true;
  try {
    await getContractByIdAction(contractId);
    setTimeout(() => {
      loadingBraches.value = false;
    }, 1000);
    selectedBranches.value = contract?.value.branches.map((branch: any) => {
      return {
        label: `${branch.branchCode} - ${branch.name}`,
        value: branch?.id,
      };
    });
  } catch (error) {
    console.log('Error -> ', error);
  }
};
</script>
<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center gap-6">
      <h1 class="flex items-center gap-2 font-bold text-black text-2xl">
        <CalendarDays />
        Gerar Novo Atendimento
      </h1>
    </section>
    <section>
      <Card class="bg-zinc-300">
        <CardHeader>
          <CardTitle>Dados do Atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="" @keydown.enter.prevent="true">
            <div class="grid grid-cols-2 gap-6">
              <div class="flex flex-col gap-6 md:max-w-[350px]">
                <h3 class="mb-4 text-lg font-bold">1. Selecione o Contrato</h3>
                <FormField v-slot="{ componentField, value }" name="contract">
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="sanitizeContracts"
                        :label="'Selecione'"
                        @on-select="getBranches"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="branch">
                  <FormItem>
                    <FormLabel>Filial</FormLabel>
                    <FormControl>
                      <LoaderCircle v-if="isLoading" class="animate-spin" />
                      <FormSelect
                        v-else
                        v-bind="componentField"
                        :items="selectedBranches"
                        :label="'Selecione'"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="origin">
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <FormControl>
                      <div class="flex items-center gap-2">
                        <MapPin />
                        <Input
                          type="text"
                          placeholder="Insira a origem"
                          v-bind="componentField"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="destination">
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <div class="flex items-center gap-2">
                        <MapPinCheck />
                        <Input
                          type="text"
                          placeholder="Insira o destino"
                          v-bind="componentField"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
              <div>
                <GoogleMap />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
