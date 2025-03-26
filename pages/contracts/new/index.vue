<script setup lang="ts">
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle, Search, WandSparkles } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});
useHead({
  title: 'Backoffice - Adicionar Novo Contrato | Urban Mobi',
});
const { toast } = useToast();

const MAX_FILE_SIZE = 4000000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(100),
    document: z.string().min(2).max(50),
    fantasyName: z.string().min(2).max(50),
    zipcode: z.string().min(2).max(8),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    phone: z.string().min(2).max(15),
    website: z.string().min(2).max(50),
    managerName: z.string().min(2).max(20),
    managerPhone: z.string().min(2).max(12),
    managerEmail: z.string().email({ message: 'Endereço de e-mail inválido' }),
    paymentTerm: z.string().min(2).max(12),
    paymentDueDate: z.number().min(0).max(30),
    logo: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 4Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg ou .png são aceitos ',
      )
      .optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const zipcode = ref('');
const isLoadingAddress = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);

const findAddress = async () => {
  const { zipcode } = form.values;

  if (zipcode?.length !== 8) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `CEP inválido. Digite novamente.`,
    });
  } else {
    try {
      isLoadingAddress.value = true;
      const address: any = await findAddressByZipcode(zipcode as string);
      if (address.erro) {
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
        form.setValues({
          zipcode: address?.cep.replace('-', ''),
          streetName: address?.logradouro,
          city: address?.localidade,
          neighborhood: address?.bairro,
          state: address?.estado,
        });
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

const { startUpload } = useUploadThing('customerLogo', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
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
  <main class="p-6">
    <section class="mb-10 flex items-center justify-between">
      <h1 class="text-3xl font-bold">Adicionar Novo Contrato</h1>
    </section>
    <div>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <section>
          <Card class="bg-zinc-200">
            <CardHeader>
              <CardTitle class="text-xl">Dados da Empresa Matriz</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="mb-4 w-full grid grid-cols-3 gap-6">
                <FormField v-slot="{ componentField }" name="document">
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
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
                <FormField v-slot="{ componentField }" name="zipcode">
                  <FormItem class="col-span-1">
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <div class="flex gap-2">
                        <Input
                          type="text"
                          v-bind="componentField"
                          v-model="zipcode"
                          maxlength="8"
                        />
                        <Button
                          @click.prevent="findAddress"
                          :disabled="zipcode.length !== 8"
                          type="button"
                        >
                          <Search v-if="!isLoadingAddress" class="w-10 h-10" />
                          <LoaderCircle
                            v-if="isLoadingAddress"
                            class="w-10 h-10 animate-spin"
                          />
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
              <div class="mb-4 w-full grid grid-cols-3 gap-6">
                <FormField v-slot="{ componentField }" name="phone">
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
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
                <FormField v-slot="{ componentField }" name="logo">
                  <FormItem>
                    <FormLabel>Logo da Empresa</FormLabel>
                    <FormControl>
                      <Input type="file" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </CardContent>
          </Card>
        </section>
        <section class="my-10">
          <Card class="bg-zinc-200">
            <CardHeader>
              <CardTitle class="text-xl">Dados do Gestor Master</CardTitle>
              <CardDescription>
                Insira os dados do Gestor Master deste contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-3 gap-6">
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
                <div class="col-span-3 p-6 border border-zinc-500 rounded-md">
                  <p class="font-bold">Dados de Acesso</p>
                  <p class="text-muted-foreground text-sm">
                    O Gesto Master usará os dados abaixo para acessar a
                    plataforma
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
                    <FormField
                      v-slot="{ componentField }"
                      name="managerPassword"
                    >
                      <FormItem>
                        <FormLabel>Senha Temporária</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            v-bind="componentField"
                            maxlength="8"
                          />
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
            </CardContent>
          </Card>
        </section>
        <section class="my-10">
          <Card class="bg-zinc-200">
            <CardHeader>
              <CardTitle class="text-xl">Condições Comerciais</CardTitle>
              <CardDescription>
                Inserir as negociações deste contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-6">
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
            </CardContent>
          </Card>
        </section>
        <section class="my-6">
          <Card class="bg-zinc-200">
            <CardHeader>
              <CardTitle class="text-xl">Precificação</CardTitle>
              <CardDescription>
                Inserir valores negociados deste contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-4 gap-6">
                <FormField v-slot="{ componentField }" name="regularKmPrice">
                  <FormItem class="relative">
                    <FormLabel>Valor por KM</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        v-bind="componentField"
                        class="pl-8"
                      />
                      <span
                        class="absolute text-sm text-zinc-400 top-[34px] left-2"
                        >R$</span
                      >
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="hourKmPrice">
                  <FormItem class="relative">
                    <FormLabel>Valor por KM / Hora</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        v-bind="componentField"
                        class="pl-8"
                      />
                      <span
                        class="absolute text-sm text-zinc-400 top-[34px] left-2"
                        >R$</span
                      >
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="exceededKmPrice">
                  <FormItem class="relative">
                    <FormLabel>Valor por KM excedente</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        v-bind="componentField"
                        class="pl-8"
                      />
                      <span
                        class="absolute text-sm text-zinc-400 top-[34px] left-2"
                        >R$</span
                      >
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="extraKmPrice">
                  <FormItem class="relative">
                    <FormLabel>Valor por KM Extra</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        v-bind="componentField"
                        class="pl-8"
                      />
                      <span
                        class="absolute text-sm text-zinc-400 top-[34px] left-2"
                        >R$</span
                      >
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </CardContent>
          </Card>
        </section>
        <section class="mt-6">
          <Button type="submit">
            <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
            Cadastrar Contrato
          </Button>
          <Button variant="ghost" class="ml-4" @click.prevent="">
            Cancelar
          </Button>
        </section>
      </form>
    </div>
  </main>
</template>

<style scoped></style>
