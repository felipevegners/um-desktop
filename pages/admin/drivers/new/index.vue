<script setup lang="ts">
import { SharedBackLink } from '#components';
import AddCarsForm from '@/components/forms/AddCarsForm.vue';
import AddressForm from '@/components/forms/AddressForm.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/toast/use-toast';
import { driverOffersList } from '@/config/drivers';
import { useDriverStore } from '@/stores/drivers.store';
import { toTypedSchema } from '@vee-validate/zod';
import { Car, Eye, EyeOff, Info, LoaderCircle, WandSparkles } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { TooltipArrow } from 'radix-vue';
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import * as z from 'zod';
import { generatePassword } from '~/lib/utils';

const { toast } = useToast();

const driverStore = useDriverStore();
const { createNewDriverAction } = driverStore;
const { loadingData } = storeToRefs(driverStore);

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Motoristas ativos | Urban Mobi',
});

const viewPassword = ref<boolean>(true);

const isLoadingSend = ref(false);
const driverCars = reactive([
  {
    carModel: '',
    carColor: '',
    carPlate: '',
    carYear: '',
    carDocumentFile: {
      name: '',
      url: '',
    },
  },
]);

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const driverSchema = toTypedSchema(
  z.object({
    name: z.string({ message: 'Obrigatório' }).min(2).max(50),
    email: z.string({ message: 'Obrigatório' }).min(2).max(50),
    userPassword: z
      .string({ message: 'A senha deve conter de 6 a 8 caracteres' })
      .min(6, 'A senha deve conter no mínimo 6 caracteres')
      .max(8, 'A senha deve conter no máximo 8 caracteres'),
    phone: z.string({ message: 'Obrigatório' }).min(2).max(50),
    document: z.string({ message: 'Obrigatório' }).min(2).max(50),
    driverLicense: z.string({ message: 'Obrigatório' }).min(2).max(50),
    licenseExpiration: z.string({ message: 'Obrigatório' }).min(2).max(50),
    licenseCategory: z.string({ message: 'Obrigatório' }).min(1).max(50),
    zipcode: z.string({ message: 'Obrigatório' }).min(2).max(50),
    streetName: z.string({ message: 'Obrigatório' }).min(2).max(50),
    streetNumber: z.string({ message: 'Obrigatório' }).min(2).max(50),
    complement: z.string({ message: 'Obrigatório' }).min(0).max(50),
    neighborhood: z.string({ message: 'Obrigatório' }).min(2).max(50),
    city: z.string({ message: 'Obrigatório' }).min(2).max(50),
    state: z.string({ message: 'Obrigatório' }).min(2).max(50),
    actuationArea: z.string({ message: 'Obrigatório' }).min(2).max(200),
    driverOffers: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: 'You have to select at least one item.',
    }),
    picture: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 5Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos ',
      )
      .optional(),
    cnhCopy: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 5Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos ',
      )
      .optional(),
    addressCopy: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 5Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos ',
      )
      .optional(),
    bankCopy: z
      .any()
      .refine((file) => file?.size <= MAX_FILE_SIZE, `Tamanho máximo é de 5Mb.`)
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos ',
      )
      .optional(),
  }),
);

const driversForm = useForm({
  validationSchema: driverSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    driverOffers: ['standard'],
  },
});

const revealPassword = () => {
  viewPassword.value = !viewPassword.value;
};

const handleGeneratePassword = () => {
  const randomPassword = generatePassword();
  if (randomPassword.length) {
    driversForm.setValues({
      userPassword: randomPassword,
    });
  }
};

const { startUpload } = useUploadThing('driverFiles', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
});
const onSubmit = driversForm.handleSubmit(async (values) => {
  const files = [values?.picture, values?.cnhCopy, values?.addressCopy, values?.bankCopy];
  console.log('FILES -> ', files);
  isLoadingSend.value = true;
  if (files.includes(undefined)) {
    toast({
      title: 'Oops!',
      description: `Nenhum arquivo anexado.`,
      variant: 'destructive',
    });
    isLoadingSend.value = false;
  } else {
    const filesResponse = await startUpload(files);
    const newDriverData = {
      driverCars,
      name: values.name,
      email: values.email,
      password: values.userPassword,
      phone: values.phone,
      document: values.document,
      driverLicense: values.driverLicense,
      licenseCategory: values.licenseCategory,
      licenseExpiration: values.licenseExpiration,
      address: {
        zipcode: values.zipcode,
        streetName: values.streetName,
        streetNumber: values.streetNumber,
        neighborhood: values.neighborhood,
        complement: values.complement,
        city: values.city,
        state: values.state,
      },
      actuationArea: values.actuationArea,
      offers: values.driverOffers,
      driverFiles: {
        picture: {
          //@ts-ignore
          name: filesResponse[0]?.name || '',
          //@ts-ignore
          url: filesResponse[0]?.ufsUrl || '',
        },
        cnhCopy: {
          //@ts-ignore
          name: filesResponse[1]?.name || '',
          //@ts-ignore
          url: filesResponse[1]?.ufsUrl || '',
        },
        addressCopy: {
          //@ts-ignore
          name: filesResponse[2]?.name || '',
          //@ts-ignore
          url: filesResponse[2]?.ufsUrl || '',
        },
        bankCopy: {
          //@ts-ignore
          name: filesResponse[3]?.name || '',
          //@ts-ignore
          url: filesResponse[3]?.ufsUrl || '',
        },
      },
      rating: ['1'],
      history: [],
      status: 'pending',
      enabled: true,
    };
    const result = await createNewDriverAction(newDriverData);
    if (result?.success) {
      toast({
        title: 'Sucesso!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: `O motorista ${values.name} foi cadastrado com sucesso!`,
      });
      isLoadingSend.value = false;
      setTimeout(() => {
        navigateTo('/admin/drivers/active');
      }, 1000);
    } else {
      if (result.statusCode === 409) {
        //@ts-ignore
        document.querySelector("input[name='email']").focus();
        driversForm.setFieldError(
          'email',
          'Já existe uma conta vinculada a este e-mail.',
        );
      }
      isLoadingSend.value = false;
      toast({
        title: 'Erro ao criar novo motorista!',
        description: result.error,
        variant: 'destructive',
      });
    }
  }
});
</script>

<template>
  <main class="p-6">
    <header>
      <SharedBackLink />
    </header>
    <section class="mb-6 flex items-center justify-between gap-6">
      <h1 class="flex items-center gap-2 font-bold text-2xl">
        <Car />
        Cadastrar Novo Motorista
      </h1>
    </section>
    <section class="mb-4 py-4">
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardContent>
            <h2 class="mt-4 mb-6 text-lg font-bold">Dados de Acesso</h2>
            <div class="mb-4 w-full grid grid-cols-3 gap-8">
              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="userPassword">
                <FormItem class="relative">
                  <FormLabel>Senha*</FormLabel>
                  <FormControl>
                    <div v-if="viewPassword" class="relative">
                      <Input
                        type="text"
                        placeholder="Insira a senha"
                        v-bind="componentField"
                        :disabled="loadingData"
                        maxlength="8"
                      />
                      <EyeOff
                        class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                        :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                        @click.prevent="revealPassword"
                      />
                    </div>
                    <div v-else class="relative">
                      <Input
                        type="password"
                        placeholder="Insira a senha"
                        v-bind="componentField"
                        :disabled="loadingData"
                        maxlength="8"
                      />
                      <Eye
                        class="h-5 w-5 absolute top-[10px] right-3 cursor-pointer hover:text-zinc-700"
                        :class="viewPassword ? 'text-zinc-700' : 'text-zinc-400'"
                        @click.prevent="revealPassword"
                      />
                    </div>
                  </FormControl>
                  <small class="text-muted-foreground">
                    *A senha deve conter de 6 a 8 caracteres</small
                  >
                  <FormMessage class="text-xs" />
                </FormItem>
              </FormField>
              <div class="relative flex items-center">
                <Button
                  class="relative px-2 top-[4px] max-w-[140px]"
                  @click.prevent="handleGeneratePassword"
                >
                  <WandSparkles class="w-6 h-6" />
                  Gerar Senha
                </Button>
              </div>
            </div>
            <h2 class="mt-4 mb-6 text-lg font-bold">Dados Pessoais</h2>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-bind="componentField"
                      v-maska="'(##) #####-####'"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="document">
                <FormItem class="col-span-1">
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      v-maska="'###.###.###-##'"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="driverLicense">
                <FormItem class="col-span-1">
                  <FormLabel>Número CNH</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
              <FormField v-slot="{ componentField }" name="licenseCategory">
                <FormItem class="col-span-1">
                  <FormLabel>Categoria CNH</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="licenseExpiration">
                <FormItem>
                  <FormLabel>Validade CNH</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" v-maska="'##/##/####'" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <section class="my-10">
              <h2 class="mt-4 mb-6 text-lg font-bold">Endereço</h2>
              <AddressForm :edit-mode="false" :form="driversForm" />
              <div class="mb-4 w-full md:grid md:grid-cols-4 gap-8">
                <FormField v-slot="{ componentField }" name="actuationArea">
                  <FormItem class="col-span-1">
                    <FormLabel>Região Atendida (KM / Área / Período)</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section>
              <h2 class="mt-4 mb-6 text-lg font-bold">Atributos / Diferenciais</h2>
              <FormField name="driverOffers">
                <FormItem>
                  <FormField
                    v-for="item in driverOffersList"
                    v-slot="{ value, handleChange }"
                    :key="item.id"
                    type="checkbox"
                    :value="item.id"
                    :unchecked-value="false"
                    name="driverOffers"
                  >
                    <FormItem class="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          @update:checked="handleChange"
                          :checked="value.includes(item.id)"
                        />
                      </FormControl>
                      <FormLabel class="font-normal">
                        {{ item.label }}
                      </FormLabel>
                    </FormItem>
                  </FormField>
                  <FormMessage />
                </FormItem>
              </FormField>
            </section>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold">Dados do(s) Veículo(s)</h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverCars" class="col-span-3" />
              </div>
            </section>
            <section class="mt-6 mb-8">
              <h2 class="mb-4 text-lg font-bold">Enviar arquivos</h2>
              <div class="grid grid-cols-3 gap-6">
                <FormField v-slot="{ handleChange, handleBlur }" name="picture">
                  <FormItem class="col-span-1">
                    <div class="flex gap-2 items-center">
                      <FormLabel>Foto Pessoal</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Info class="w-4 h-4 text-zinc-400" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <TooltipArrow />
                            <p>Enviar foto de rosto com fundo claro e sem adereços</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input
                        id="picture"
                        type="file"
                        @change="handleChange"
                        @blur="handleBlur"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ handleChange, handleBlur }" name="cnhCopy">
                  <FormItem class="col-span-1">
                    <div class="flex gap-2 items-center">
                      <FormLabel>Cópia CNH</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Info class="w-4 h-4 text-zinc-400" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <TooltipArrow />
                            <p>Enviar cópia frente e verso com assinatura</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input
                        id="cnhCopy"
                        type="file"
                        @change="handleChange"
                        @blur="handleBlur"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ handleChange, handleBlur }" name="addressCopy">
                  <FormItem class="col-span-1">
                    <div class="flex gap-2 items-center">
                      <FormLabel>Comprovante Endereço</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Info class="w-4 h-4 text-zinc-400" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <TooltipArrow />
                            <p>Enviar comprovante de no máximo 3 meses atrás</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input
                        id="addressCopy"
                        type="file"
                        @change="handleChange"
                        @blur="handleBlur"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ handleChange, handleBlur }" name="bankCopy">
                  <FormItem class="col-span-1">
                    <div class="flex gap-2 items-center">
                      <FormLabel>Comprovante Bancário</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Info class="w-4 h-4 text-zinc-400" />
                          </TooltipTrigger>
                          <TooltipContent class="bg-zinc-700 text-white">
                            <TooltipArrow />
                            <p>
                              Enviar comprovante dos dados bancário constando nome
                              completo, agência e conta
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input
                        id="bankCopy"
                        type="file"
                        @change="handleChange"
                        @blur="handleBlur"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
          </CardContent>
        </Card>
        <section class="pt-8">
          <Button type="submit">
            <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
            Cadastrar
          </Button>
          <Button
            variant="ghost"
            class="ml-4"
            @click.prevent="navigateTo('/admin/drivers/active')"
          >
            Cancelar
          </Button>
        </section>
      </form>
    </section>
  </main>
</template>

<style scoped></style>
