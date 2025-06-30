<script setup lang="ts">
import { SharedBackLink } from '#components';
import AddCarsForm from '@/components/forms/AddCarsForm.vue';
import AddressForm from '@/components/forms/AddressForm.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import {
  Calendar,
  Car,
  Check,
  Edit,
  Eye,
  File,
  History,
  Info,
  LoaderCircle,
  MonitorCog,
  UserCog,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { dateFormat } from '~/lib/utils';
import { useDriverStore } from '~/stores/drivers.store';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: `Minha Conta - Motorista Parceiro | Urban Mobi`,
});

const { toast } = useToast();

const driverStore = useDriverStore();
const { getDriverByIdAction, updateDriverAction } = driverStore;
const { loadingData, loadingSend, driver } = storeToRefs(driverStore);

const route = useRoute();
const { data } = useAuth();
//@ts-ignore
await getDriverByIdAction(data?.value?.user?.id as string);

const editDriverCnhCopy = ref(false);
const editDriverAddressCopy = ref(false);
const editDriverBankCopy = ref(false);
const driverSituation = ref<boolean>(false);
const driverCars = ref<any>();
const driverFiles = ref<any>();

driverCars.value = driver?.value.driverCars || [];
driverFiles.value = {
  picture: {
    name: driver?.value.driverFiles?.picture?.name,
    url: driver?.value.driverFiles?.picture?.url,
  },
  cnhCopy: {
    name: driver?.value.driverFiles.cnhCopy.name,
    url: driver?.value.driverFiles.cnhCopy.url,
  },
  addressCopy: {
    name: driver?.value.driverFiles.addressCopy.name,
    url: driver?.value.driverFiles.addressCopy.url,
  },
  bankCopy: {
    name: driver?.value.driverFiles.bankCopy.name,
    url: driver?.value.driverFiles.bankCopy.url,
  },
};
const driverProfilePicture = reactive({
  name: driver?.value.driverFiles?.picture?.name,
  url: driver?.value.driverFiles?.picture?.url,
});

driverSituation.value = driver?.value.enabled;

const hasPendingActions = computed(() => {
  return (
    driverFiles.value.cnhCopy.name === '' &&
    driverFiles.value.addressCopy.name === '' &&
    driverFiles.value.bankCopy.name === ''
  );
});

const driverSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    phone: z.string().min(2).max(50),
    document: z.string().min(2).max(50),
    driverLicense: z.string().min(2).max(50),
    licenseExpiration: z.string({ message: 'Obrigatório' }).min(2).max(50),
    licenseCategory: z.string({ message: 'Obrigatório' }).min(1).max(50),
    zipcode: z.string().min(2).max(50),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    actuationArea: z.string().min(2).max(200),
    scheduleOpen: z.boolean(),
    outsideActuation: z.boolean(),
  }),
);

const driversForm = useForm({
  validationSchema: driverSchema,
  initialValues: {
    ...driver?.value,
    zipcode: driver?.value.address?.zipcode,
    streetName: driver?.value.address?.streetName,
    streetNumber: driver?.value.address?.streetNumber,
    complement: driver?.value.address?.complement,
    neighborhood: driver?.value.address?.neighborhood,
    city: driver?.value.address?.city,
    state: driver?.value.address?.state,
    scheduleOpen: driver?.value.scheduleOpen,
    outsideActuation: driver?.value.outsideActuation,
  },
});

const onSubmit = driversForm.handleSubmit(async (values) => {
  const newDriverData = {
    id: driver?.value.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    document: values.document,
    driverLicense: values.driverLicense,
    licenseExpiration: values.licenseExpiration,
    licenseCategory: values.licenseCategory,
    driverCars: driverCars.value,
    driverFiles: {
      ...driverFiles.value,
      picture: driverProfilePicture,
    },
    address: {
      zipcode: values.zipcode,
      streetName: values.streetName,
      streetNumber: values.streetNumber,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
    },
    actuationArea: values.actuationArea,
    scheduleOpen: values.scheduleOpen,
    outsideActuation: values.outsideActuation,
    rating: ['1'],
    history: [],
    status: hasPendingActions ? 'validated' : 'pending',
    enabled: driverSituation.value,
  };

  try {
    //@ts-ignore
    await updateDriverAction(newDriverData);
  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-600 border-0 text-white text-2xl',
      description: `Ocorreu um erro ${error} ao adicionar o motorista.`,
    });
  } finally {
    toast({
      title: 'Sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `O motorista ${values?.name} foi cadastrado com sucesso!`,
    });
    driversForm.values = newDriverData;
    navigateTo('/driver');
  }
});
</script>

<template>
  <header>
    <div class="flex items-center">
      <SharedBackLink />
    </div>
  </header>
  <main class="px-6">
    <section
      v-if="loadingData"
      class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else class="py-4">
      <h1 class="mb-6 flex items-center gap-2 text-2xl font-bold">
        <UserCog class="w-6 h-6" />
        Meus Dados
      </h1>
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardHeader>
            <div class="flex justify-between">
              <div class="flex gap-10 flex-1">
                <AvatarEdit v-model="driverProfilePicture" uploadUrl="driverFiles" />
                <div class="flex flex-col gap-6">
                  <h1 class="mb-2 text-2xl font-bold">
                    {{ driversForm?.values?.name }}
                  </h1>
                  <div class="flex flex-col items-start">
                    <Button type="button" class="mb-4 cursor-not-allowed">
                      <Calendar />
                      Minha agenda
                    </Button>
                    <div>
                      <small class="text-zinc-500">Cadastrado em:</small>
                      <p class="mb-2 font-bold">
                        {{ dateFormat(driver?.createdAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-20">
            <section>
              <h2 class="mb-6 text-lg font-bold">Dados Pessoais</h2>
              <div class="mb-4 w-full grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
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
                        v-maska="'(##) # ####-####'"
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
                        v-bind="componentField"
                        v-maska="'###.###.###-##'"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="driverLicense">
                  <FormItem class="col-span-1">
                    <FormLabel>Número CNH</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="ex. 23456789019"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
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
            </section>
            <section>
              <h2 class="mb-6 text-lg font-bold">Endereço e Área de Atuação</h2>
              <AddressForm :edit-mode="false" :form="driversForm" />
              <div class="mb-4 w-full md:grid md:grid-cols-4 gap-8">
                <FormField v-slot="{ componentField }" name="actuationArea">
                  <FormItem class="col-span-1">
                    <FormLabel>Área de atuação</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold flex items-center gap-2">
                <Car :size="24" />
                Meus Veículos
              </h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverCars" class="col-span-3" />
              </div>
            </section>
            <section
              class="my-10"
              :class="`${hasPendingActions ? 'p-6 rounded-md border border-red-500 bg-red-200' : ''}`"
            >
              <h2 class="mb-4 text-lg font-bold flex items-center gap-2">
                <File />
                Meus Documentos Enviados
              </h2>
              <p
                v-if="hasPendingActions"
                class="py-2 px-3 my-4 bg-red-500 text-white rounded-md text-sm"
              >
                Você ainda não enviou seus documentos. Faça o envio para liberar a
                plataforma.
              </p>
              <div class="flex">
                <ul class="w-full space-y-4">
                  <li class="py-4 px-6 bg-white rounded-md">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <p>
                          Cópia CNH:
                          <span class="text-zinc-500 underline">
                            {{ driverFiles?.cnhCopy?.name }}
                          </span>
                        </p>
                        <Check
                          v-if="driverFiles?.cnhCopy?.name"
                          class="w-5 h-5 text-green-500"
                        />
                      </div>
                      <div class="flex items-center gap-4 border-separate">
                        <small class="text-small">Ações:</small>
                        <a
                          v-if="driverFiles?.cnhCopy?.name"
                          target="_blank"
                          :href="driverFiles?.cnhCopy?.url"
                          alt="Visualizar"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <Eye class="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                              </TooltipTrigger>
                              <TooltipContent class="bg-zinc-700 text-white">
                                <p>Ver documento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </a>
                        <div
                          v-if="!driverFiles.cnhCopy.name || editDriverCnhCopy"
                          class="flex gap-4 items-center"
                        >
                          <UploadButton
                            class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
                            :config="{
                              appearance: {
                                container: '!items-start',
                                allowedContent: '!absolute !top-10',
                              },
                              content: {
                                allowedContent({ ready, fileTypes, isUploading }) {
                                  if (ready) return '';
                                  if (isUploading)
                                    return 'Enviando seu arquivo, aguarde...';
                                },
                              },
                              endpoint: 'driverFiles',
                              onClientUploadComplete: (file) => {
                                driverFiles.cnhCopy.name = file[0].name;
                                driverFiles.cnhCopy.url = file[0].ufsUrl;
                                editDriverCnhCopy = !editDriverCnhCopy;
                                toast({
                                  title: 'Feito!',
                                  class: 'bg-green-500 border-0 text-white text-2xl',
                                  description: `Arquivo enviado com sucesso!`,
                                });
                              },
                              onUploadError: (error) => {
                                toast({
                                  title: 'Oops!',
                                  class: 'bg-red-500 border-0 text-white text-2xl',
                                  description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`,
                                });
                              },
                            }"
                          />
                          <X
                            v-if="editDriverCnhCopy"
                            class="w-5 h-5 text-zinc-500 hover:text-zinc-700 cursor-pointer"
                            @click.prevent="editDriverCnhCopy = false"
                          />
                        </div>
                        <TooltipProvider v-else>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <Edit
                                class="w-5 h-5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                @click.prevent="editDriverCnhCopy = true"
                              />
                            </TooltipTrigger>
                            <TooltipContent class="bg-zinc-700 text-white">
                              <p>Alterar documento</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </li>
                  <li class="py-4 px-6 bg-white rounded-md">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <p>
                          Comprovante de Endereço:
                          <span class="text-zinc-500 underline">{{
                            driverFiles?.addressCopy?.name
                          }}</span>
                        </p>
                        <Check
                          v-if="driverFiles?.addressCopy?.name"
                          class="w-5 h-5 text-green-500"
                        />
                      </div>
                      <div class="flex items-center gap-4 border-separate">
                        <small class="text-small">Ações:</small>
                        <a
                          v-if="driverFiles?.addressCopy?.name"
                          target="_blank"
                          :href="driverFiles.addressCopy?.url"
                          alt="Visualizar"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <Eye class="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                              </TooltipTrigger>
                              <TooltipContent class="bg-zinc-700 text-white">
                                <p>Ver documento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </a>
                        <div
                          v-if="!driverFiles.addressCopy?.name || editDriverAddressCopy"
                          class="flex gap-4 items-center"
                        >
                          <UploadButton
                            class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
                            :config="{
                              appearance: {
                                container: '!items-start',
                                allowedContent: '!absolute !top-10',
                              },
                              content: {
                                allowedContent({ ready, fileTypes, isUploading }) {
                                  if (ready) return '';
                                  if (isUploading)
                                    return 'Enviando seu arquivo, aguarde...';
                                },
                              },
                              endpoint: 'driverFiles',
                              onClientUploadComplete: (file) => {
                                driverFiles.addressCopy.name = file[0].name;
                                driverFiles.addressCopy.url = file[0].ufsUrl;
                                editDriverAddressCopy = !editDriverAddressCopy;
                                toast({
                                  title: 'Feito!',
                                  class: 'bg-green-500 border-0 text-white text-2xl',
                                  description: `Arquivo enviado com sucesso!`,
                                });
                              },
                              onUploadError: (error) => {
                                toast({
                                  title: 'Oops!',
                                  class: 'bg-red-500 border-0 text-white text-2xl',
                                  description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`,
                                });
                              },
                            }"
                          />
                          <X
                            v-if="editDriverAddressCopy"
                            class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.prevent="editDriverAddressCopy = false"
                          />
                        </div>
                        <TooltipProvider v-else>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <Edit
                                class="w-5 h-5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                @click.prevent="editDriverAddressCopy = true"
                              />
                            </TooltipTrigger>
                            <TooltipContent class="bg-zinc-700 text-white">
                              <p>Alterar documento</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </li>
                  <li class="py-4 px-6 bg-white rounded-md">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <p>
                          Comprovante Bancário:
                          <span class="text-zinc-500 underline">{{
                            driverFiles?.bankCopy?.name
                          }}</span>
                        </p>
                        <Check
                          v-if="driverFiles?.bankCopy?.name"
                          class="w-5 h-5 text-green-500"
                        />
                      </div>
                      <div class="flex items-center gap-4 border-separate">
                        <small class="text-small">Ações:</small>
                        <a
                          v-if="driverFiles?.bankCopy?.name"
                          target="_blank"
                          :href="driverFiles.bankCopy?.url"
                          alt="Visualizar"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <Eye class="w-5 h-5 text-zinc-400 hover:text-zinc-700" />
                              </TooltipTrigger>
                              <TooltipContent class="bg-zinc-700 text-white">
                                <p>Ver documento</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </a>
                        <div
                          v-if="!driverFiles.bankCopy?.name || editDriverBankCopy"
                          class="flex gap-4 items-center"
                        >
                          <UploadButton
                            class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500 ut-button:text-sm"
                            :config="{
                              appearance: {
                                container: '!items-start',
                                allowedContent: '!absolute !top-10',
                              },
                              content: {
                                allowedContent({ ready, fileTypes, isUploading }) {
                                  if (ready) return '';
                                  if (isUploading)
                                    return 'Enviando seu arquivo, aguarde...';
                                },
                              },
                              endpoint: 'driverFiles',
                              onClientUploadComplete: (file) => {
                                driverFiles.bankCopy.name = file[0].name;
                                driverFiles.bankCopy.url = file[0].ufsUrl;
                                editDriverBankCopy = !editDriverBankCopy;
                                toast({
                                  title: 'Feito!',
                                  class: 'bg-green-500 border-0 text-white text-2xl',
                                  description: `Arquivo enviado com sucesso!`,
                                });
                              },
                              onUploadError: (error) => {
                                toast({
                                  title: 'Oops!',
                                  class: 'bg-red-500 border-0 text-white text-2xl',
                                  description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`,
                                });
                              },
                            }"
                          />
                          <X
                            v-if="editDriverBankCopy"
                            class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.prevent="editDriverBankCopy = false"
                          />
                        </div>
                        <TooltipProvider v-else>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <Edit
                                class="w-5 h-5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                @click.prevent="editDriverBankCopy = true"
                              />
                            </TooltipTrigger>
                            <TooltipContent class="bg-zinc-700 text-white">
                              <p>Alterar documento</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </section>
            <section class="my-10">
              <h2 class="my-6 font-bold text-xl flex items-center gap-2">
                <History />
                Histórico de Atendimentos
              </h2>
              <div class="mb-6 p-6 flex items-center justify-center rounded-md bg-white">
                <p class="text-zinc-400">Nenhum histórico encontrado</p>
              </div>
            </section>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold flex items-center gap-2">
                <MonitorCog />
                Meu Painel de Controle
              </h2>
              <div class="flex gap-8">
                <div
                  class="px-4 h-[150px] flex flex-col items-center justify-center gap-6 bg-white rounded-md"
                >
                  <div class="flex gap-1 items-center justify-center">
                    <h3 class="text-sm font-bold">Receber Agendamentos</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Info class="w-4 h-4 text-zinc-400" />
                        </TooltipTrigger>
                        <TooltipContent class="bg-zinc-700 text-white">
                          <p>Dejesa receber novos agendamentos?</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormField v-slot="{ value, handleChange }" name="scheduleOpen">
                    <FormItem>
                      <div class="flex items-center space-x-3">
                        <Label for="scheduleOpen" class="text-md flex gap-2 items-center">
                          <small>Não</small>
                        </Label>
                        <FormControl>
                          <Switch
                            :checked="value"
                            aria-readonly
                            @update:checked="handleChange"
                          />
                        </FormControl>
                        <Label for="scheduleOpen" class="text-md flex gap-2 items-center">
                          <small>Sim</small>
                        </Label>
                      </div>
                    </FormItem>
                  </FormField>
                </div>
                <div
                  class="px-4 h-[150px] flex flex-col items-center justify-center gap-6 bg-white rounded-md"
                >
                  <div class="flex gap-1 items-center justify-center">
                    <h3 class="text-sm font-bold">Atendimento Fora da Área</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <Info class="w-4 h-4 text-zinc-400" />
                        </TooltipTrigger>
                        <TooltipContent class="bg-zinc-700 text-white">
                          <p>Dejesa atuar fora de sua área de atendimento?</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormField v-slot="{ value, handleChange }" name="outsideActuation">
                    <FormItem>
                      <div class="flex items-center space-x-3">
                        <Label
                          for="outsideActuation"
                          class="text-md flex gap-2 items-center"
                        >
                          <small>Não</small>
                        </Label>
                        <FormControl>
                          <Switch
                            :checked="value"
                            aria-readonly
                            @update:checked="handleChange"
                          />
                        </FormControl>
                        <Label
                          for="outsideActuation"
                          class="text-md flex gap-2 items-center"
                        >
                          <small>Sim</small>
                        </Label>
                      </div>
                    </FormItem>
                  </FormField>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
        <section class="pt-8">
          <Button type="submit">
            <LoaderCircle v-if="loadingSend" class="w-10 h-10 animate-spin" />
            Salvar alterações
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
