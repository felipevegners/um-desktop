<script setup lang="ts">
import { Lock, WandSparkles } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useContractsStore } from '~/stores/admin/contracts.store';

const store = useContractsStore();
const { contractId } = storeToRefs(store);

definePageMeta({
  name: 'MasterManagerForm',
});

defineProps<{
  editMode?: boolean;
}>();
</script>
<template v-if="currentStep === 1">
  <section class="px-6">
    <pre>{{ contractId }}</pre>
    <div class="mb-4 grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="managerName">
        <FormItem>
          <FormLabel>Nome</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="managerCellPhone">
        <FormItem>
          <FormLabel>Celular</FormLabel>
          <FormControl>
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'(##) # ####-####'"
            />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="position">
        <FormItem>
          <FormLabel>Cargo</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="department">
        <FormItem>
          <FormLabel>Departamento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <div class="col-span-4 p-6 border border-zinc-900 rounded-md">
        <p class="font-bold">Dados de Acesso</p>
        <p class="text-muted-foreground text-sm">
          O Gestor Master usará os dados abaixo para acessar a plataforma
        </p>
        <div class="mt-6 grid grid-cols-3 gap-6 items-end">
          <FormField v-slot="{ componentField }" name="managerEmail">
            <FormItem class="relative">
              <FormLabel>E-mail de Acesso</FormLabel>
              <FormControl>
                <Input type="email" v-bind="componentField" />
              </FormControl>
              <FormMessage
                class="p-2 absolute w-full bg-red-500 text-white text-sm rounded-md"
              />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Senha Temporária</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" maxlength="8" />
              </FormControl>
            </FormItem>
          </FormField>
          <Button
            v-if="editMode"
            class="mb-1 px-2 max-w-[190px]"
            @click.prevent=""
          >
            <Lock class="w-6 h-6" />
            Gerar Nova Senha
          </Button>
          <Button v-else class="mb-1 px-2 max-w-[140px]" @click.prevent="">
            <WandSparkles class="w-6 h-6" />
            Gerar Senha
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
