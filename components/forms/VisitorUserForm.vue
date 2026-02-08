<script setup lang="ts">
const props = defineProps<{
  visitorUser: boolean;
  usersList: any[];
  form?: any;
  formSchema?: any;
}>();

const emit = defineEmits(['toogleForm', 'selectedUser']);
</script>
<template>
  <div class="flex items-center gap-3">
    <Checkbox @update:checked="$emit('toogleForm')" />
    <label class="mt-0 block text-sm leading-none font-medium">
      Atendimento para usuário visitante
    </label>
  </div>
  <div v-if="visitorUser" class="flex flex-col md:grid md:grid-cols-3 gap-6">
    <FormField v-slot="{ componentField }" name="visitorName">
      <FormItem class="space-y-0">
        <FormLabel class="block mb-2">Nome*</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="visitorPhone">
      <FormItem class="space-y-0">
        <FormLabel class="block mb-2">Celular*</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" v-maska="'(##) #####-####'" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="visitorCompany">
      <FormItem class="space-y-0">
        <FormLabel class="block mb-2">Empresa</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="visitorReason">
      <FormItem class="space-y-0">
        <FormLabel class="block mb-2">Motivo da visita</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" />
        </FormControl>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="user">
      <FormItem class="space-y-0">
        <FormLabel class="block mb-2">Usuário responsável*</FormLabel>
        <FormControl>
          <SharedSelectSearchUser
            :items="usersList"
            @on-select="(value) => $emit('selectedUser', value)"
            v-bind="componentField"
          />
        </FormControl>
      </FormItem>
    </FormField>
  </div>
</template>

<style scoped></style>
