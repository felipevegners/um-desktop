<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';

definePageMeta({
  name: 'ComercialConditionsForm',
});

const isLoadingAddress = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);

const { toast } = useToast();

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(100),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});
const onSubmit = form.handleSubmit(async (values) => {
  console.log('Values -> ', values);
  // const files = [values?.logo];
  // isLoadingSend.value = true;

  // try {
  //   if (!files) return;
  //   const filesResponse = await startUpload(files);
  //   const {
  //     name,
  //     document,
  //     fantasyName,
  //     streetName,
  //     streetNumber,
  //     complement,
  //     neighborhood,
  //     city,
  //     state,
  //     zipcode,
  //     phone,
  //     website,
  //     managerName,
  //     managerPhone,
  //     managerEmail,
  //     paymentTerm,
  //     paymentDueDate,
  //   } = values;

  //   const newCustomerData = {
  //     name,
  //     document,
  //     fantasyName,
  //     address: {
  //       zipcode,
  //       streetName,
  //       streetNumber,
  //       complement,
  //       neighborhood,
  //       city,
  //       state,
  //     },
  //     billingInfo: {
  //       billing: paymentTerm,
  //       dueDate: paymentDueDate,
  //     },
  //     phone,
  //     website,
  //     logo: {
  //       //@ts-ignore
  //       name: filesResponse[0]?.name || '',
  //       //@ts-ignore
  //       url: filesResponse[0]?.ufsUrl || '',
  //     },
  //     adminId: '67bda5bd3e3ed4a5d2bdb799',
  //     managerName,
  //     managerPhone,
  //     managerEmail,
  //     ccAreas: [...ccAreas],
  //     status: 'pending',
  //     enabled: false,
  //   };

  //   await createNewCustomerAction(newCustomerData as any);
  // } catch (error) {
  //   console.log('Error -> ', error);
  //   toast({
  //     title: 'Opss!',
  //     class: 'bg-red-500 border-0 text-white text-2xl',
  //     description: `Ocorreu um erro ao cadastrar o cliente. Tente novamente.`,
  //   });
  // } finally {
  //   setTimeout(() => {}, 2000);
  //   toast({
  //     title: 'Tudo pronto!',
  //     class: 'bg-green-600 border-0 text-white text-2xl',
  //     description: `Empresa cadastrada com sucesso!`,
  //   });
  //   showAddForm.value = !showAddForm.value;
  //   await getCustomersAction();
  // }
});
</script>
<template>
  <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
    <section class="px-6">
      <div class="mb-4 grid grid-cols-2 gap-6">
        <FormField v-slot="{ componentField }" name="paymentTerm">
          <FormItem>
            <FormLabel>Tipo de Faturamento</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="[
                  {
                    label: '1 a 30 dias',
                    value: '01-30',
                  },
                  {
                    label: '1 a 15',
                    value: '01-15',
                  },
                  {
                    label: 'Aberto',
                    value: '00-00',
                  },
                ]"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="paymentDueDate">
          <FormItem>
            <FormLabel>Prazo de Pagamento (Dias)</FormLabel>
            <FormControl>
              <Input type="number" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
    </section>
    <section class="px-6">
      <Button type="submit">
        <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
        Salvar
      </Button>
      <Button variant="ghost" class="ml-4" @click.prevent="form.resetForm()">
        Cancelar
      </Button>
    </section>
  </form>
</template>

<style scoped></style>
