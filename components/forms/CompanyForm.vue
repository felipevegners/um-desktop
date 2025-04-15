<script lang="ts" setup>
import { LoaderCircle, Search } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';

definePageMeta({
  name: 'CompanyForm',
});

defineProps<{
  findAddress?: any;
  loading?: boolean;
  isEditing?: boolean;
}>();
</script>
<template v-if="currentStep === 0">
  <section class="px-6">
    <div class="mb-4 w-full grid grid-cols-3 gap-6">
      <FormField v-slot="{ componentField }" name="document">
        <FormItem>
          <FormLabel>CNPJ</FormLabel>
          <FormControl>
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'##.###.###/####-##'"
            />
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
    <div class="mb-4 w-full grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField, value }" name="zipcode">
        <FormItem class="col-span-1">
          <FormLabel>CEP</FormLabel>
          <FormControl>
            <div class="flex gap-2">
              <Input
                type="text"
                v-bind="componentField"
                maxlength="9"
                v-maska="'#####-###'"
                name="zipcode"
              />
              <Button
                @click.prevent="findAddress(value)"
                :disabled="value?.length !== 9"
                type="button"
              >
                <Search v-if="!loading" class="w-10 h-10" />
                <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
              </Button>
            </div>
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="streetName">
        <FormItem class="col-span-2">
          <FormLabel>Endereço</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="streetNumber">
        <FormItem class="col-span-1">
          <FormLabel>Número</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="complement">
        <FormItem class="col-span-1">
          <FormLabel>Complemento</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="neighborhood">
        <FormItem class="col-span-1">
          <FormLabel>Bairro</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="city">
        <FormItem class="col-span-1">
          <FormLabel>Cidade</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="state">
        <FormItem class="col-span-1">
          <FormLabel>Estado</FormLabel>
          <FormControl>
            <Input type="text" v-bind="componentField" />
          </FormControl>
        </FormItem>
      </FormField>
    </div>
    <div class="mb-4 w-full grid grid-cols-4 gap-6">
      <FormField v-slot="{ componentField }" name="phone">
        <FormItem>
          <FormLabel>Telefone</FormLabel>
          <FormControl>
            <Input
              type="text"
              v-bind="componentField"
              v-maska="'(##) ####-####'"
            />
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
  </section>
</template>
