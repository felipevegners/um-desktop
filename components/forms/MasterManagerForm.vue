<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle, WandSparkles } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';

definePageMeta({
  name: 'MasterManagerForm',
});

// defineOptions({
//   name: 'MasterManagerForm'
// })

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
      <div class="mb-4 grid grid-cols-3 gap-6">
        <FormField v-slot="{ componentField }" name="managerName">
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="managerPhone">
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="managerPosition">
          <FormItem>
            <FormLabel>Cargo</FormLabel>
            <FormControl>
              <Input type="text" v-bind="componentField" />
            </FormControl>
          </FormItem>
        </FormField>
        <div class="col-span-3 p-6 border border-zinc-900 rounded-md">
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
                <!-- <FormMessage
                      class="p-2 absolute w-full bg-red-500 text-white text-sm rounded-md"
                    /> -->
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="managerPassword">
              <FormItem>
                <FormLabel>Senha Temporária</FormLabel>
                <FormControl>
                  <Input type="text" v-bind="componentField" maxlength="8" />
                </FormControl>
              </FormItem>
            </FormField>
            <Button class="px-2 max-w-[140px]">
              <WandSparkles class="w-6 h-6" />
              Gerar Senha
            </Button>
          </div>
        </div>
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
