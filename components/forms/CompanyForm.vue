<script lang="ts" setup>
import { vMaska } from 'maska/vue';

import AddressForm from './AddressForm.vue';

definePageMeta({
  name: 'CompanyForm',
});

const props = defineProps<{
  loading?: boolean;
  isEditing?: boolean;
  form?: any;
}>();
</script>
<template v-if="currentStep === 0">
  <div class="mb-4 w-full grid grid-cols-3 gap-6">
    <FormField v-slot="{ componentField }" name="document">
      <FormItem>
        <FormLabel>CNPJ</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" v-maska="'##.###.###/####-##'" />
        </FormControl>
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>Razão Social</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="fantasyName">
      <FormItem>
        <FormLabel>Nome Fantasia</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
      </FormItem>
    </FormField>
  </div>
  <!-- Address Form -->
  <AddressForm :form="props.form" />
  <div class="mb-4 w-full grid grid-cols-4 gap-6">
    <FormField v-slot="{ componentField }" name="phone">
      <FormItem>
        <FormLabel>Telefone</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" v-maska="'(##) ####-####'" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="phoneExtension">
      <FormItem>
        <FormLabel>Ramal</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="website">
      <FormItem>
        <FormLabel>Site</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
      </FormItem>
    </FormField>
    <FormField v-if="!isEditing" v-slot="{ componentField }" name="logo">
      <FormItem>
        <FormLabel>Logo da Empresa</FormLabel>
        <FormControl>
          <Input type="file" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <slot />
  </div>
</template>
