<script setup lang="ts">
import { useToast } from '@/components/ui/toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { LoaderCircle, Search } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { useForm } from 'vee-validate';
import { ref } from 'vue';

defineOptions({
  name: 'AddressForm',
});

const { toast } = useToast();

const props = defineProps<{
  editMode?: boolean;
  form?: any;
}>();

const isLoadingAddress = ref<boolean>(false);

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
      props.form.setValues({
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
            />
            <Button
              @click.prevent="findAddress(value)"
              :disabled="value?.length !== 9"
              type="button"
            >
              <Search v-if="!isLoadingAddress" class="w-10 h-10" />
              <LoaderCircle v-if="isLoadingAddress" class="w-10 h-10 animate-spin" />
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
</template>

<style scoped></style>
