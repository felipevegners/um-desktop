<script setup lang="ts">
import { SharedBackLink } from '#components';
import AddCarsForm from '@/components/admin/drivers/AddCarsForm.vue';
import AddressForm from '@/components/forms/AddressForm.vue';
import AvatarEdit from '@/components/shared/AvatarEdit.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { useToast } from '@/components/ui/toast/use-toast';
import { userDriverStore } from '@/stores/admin/drivers.store';
import { toTypedSchema } from '@vee-validate/zod';
import {
  Calendar,
  Car,
  Check,
  Edit,
  Eye,
  File,
  Info,
  LoaderCircle,
  Trash,
  X,
} from 'lucide-vue-next';
import { vMaska } from 'maska/vue';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { dateFormat } from '~/lib/utils';

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

useHead({
  title: `Backoffice - Editar Motorista | Urban Mobi`,
});

const { toast } = useToast();

const driverStore = userDriverStore();
const { getDriverByIdAction, updateDriverAction } = driverStore;
const { loadingData, loadingSend, driver } = storeToRefs(driverStore);

const route = useRoute();
await getDriverByIdAction(route.params.id as string);

const editDriverCnhCopy = ref(false);
const editDriverAddressCopy = ref(false);
const editDriverBankCopy = ref(false);
const driverSituation = ref<boolean>(false);
const driverCars = ref<any>();
const driverFiles = ref<any>();

driverCars.value = driver?.value.driverCars;
driverFiles.value = driver?.value.driverFiles;
driverSituation.value = driver?.value.enabled;

const driverProfilePicture = reactive({
  name: driver?.value.driverFiles.picture.name,
  url: driver?.value.driverFiles.picture.url,
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
    status: z.string().min(2).max(50),
    enabled: z.boolean(),
    scheduleOpen: z.boolean(),
    outsideActuation: z.boolean(),
  }),
);

const driversForm = useForm({
  validationSchema: driverSchema,
  initialValues: {
    ...driver?.value,
    zipcode: driver?.value.address.zipcode,
    streetName: driver?.value.address.streetName,
    streetNumber: driver?.value.address.streetNumber,
    complement: driver?.value.address.complement,
    neighborhood: driver?.value.address.neighborhood,
    city: driver?.value.address.city,
    state: driver?.value.address.state,
    scheduleOpen: driver?.value.scheduleOpen,
    outsideActuation: driver?.value.outsideActuation,
    status: driver?.value.status,
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
    status: values.status,
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
      description: `O motorista ${values.name} foi cadastrado com sucesso!`,
    });
    driversForm.values = newDriverData;
    navigateTo('/admin/drivers/active');
  }
});
</script>

<template>
  <main class="p-6">
    <header>
      <div class="mb-6 flex items-center">
        <SharedBackLink />
      </div>
    </header>
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-2 text-2xl font-bold">
        <Car class="w-6 h-6" />
        Editar Motorista
      </h1>
      <div class="flex gap-10 items-center">
        <div>
          <Label class="text-md font-bold"> Desativar Motorista </Label>
          <div class="mt-2 flex items-center gap-3">
            <Label class="text-sm text-zinc-500"> Inativo </Label>
            <Switch
              v-model:checked="driverSituation"
              class="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
            />
            <Label class="text-sm text-zinc-500"> Ativo </Label>
          </div>
        </div>
        <Button variant="destructive" @click="">
          <Trash class="w-4 h-4" /> Excluir Motorista
        </Button>
      </div>
    </section>
    <section
      v-if="loadingData"
      class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md"
    >
      <LoaderCircle :size="48" class="animate-spin" />
    </section>
    <section v-else class="mb-4 py-4">
      <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
        <Card class="bg-zinc-200">
          <CardHeader>
            <div class="flex justify-between">
              <div class="flex gap-10 flex-1">
                <AvatarEdit v-model="driverProfilePicture" uploadUrl="driverFiles" />
                <div class="flex flex-col">
                  <h1 class="mb-2 text-2xl font-bold">
                    {{ driversForm.values.name }}
                  </h1>
                  <div class="flex flex-col items-start">
                    <Button type="button" class="mb-4 cursor-not-allowed">
                      <Calendar />
                      Ver Agenda
                    </Button>
                    <small class="text-zinc-500">Cadastrado em:</small>
                    <p class="mb-2 font-bold">
                      {{ dateFormat(driver?.createdAt) }}
                    </p>
                    <small class="text-zinc-500">Modificado em:</small>
                    <p class="font-bold">
                      {{ dateFormat(driver?.updatedAt) }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex-1 md:max-w-[350px]">
                <FormField v-slot="{ componentField }" name="status">
                  <FormItem>
                    <FormLabel class="font-bold flex-1">Status</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="[
                          {
                            label: 'Validado',
                            value: 'validated',
                          },
                          {
                            label: 'Pendente',
                            value: 'pending',
                          },
                        ]"
                        label="Selecione"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h2 class="mt-4 mb-6 text-lg font-bold">Dados Pessoais</h2>
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
            </div>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
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
            <section class="my-10">
              <h2 class="mt-4 mb-6 text-lg font-bold">Endereço e Área de Atuação</h2>
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
              <h2 class="mb-4 text-lg font-bold">Editar Veículo(s)</h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverCars" class="col-span-3" />
              </div>
            </section>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold">Documentos Enviados</h2>
              <div class="flex">
                <ul class="w-full">
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
                        <p>
                          Cópia CNH:
                          <span class="text-zinc-500 underline">{{
                            driverFiles?.cnhCopy?.name
                          }}</span>
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
                          :href="driverFiles.cnhCopy.url"
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
                        <div v-if="editDriverCnhCopy" class="flex gap-4 items-center">
                          <UploadButton
                            class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
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
                            class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.preven="() => (editDriverCnhCopy = !editDriverCnhCopy)"
                          />
                        </div>
                        <TooltipProvider v-else>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <Edit
                                class="w-5 h-5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                @click.preven="
                                  () => (editDriverBankCopy = !editDriverBankCopy)
                                "
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
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
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
                        <div v-if="editDriverAddressCopy" class="flex gap-4 items-center">
                          <UploadButton
                            class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
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
                            class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.preven="
                              () => (editDriverAddressCopy = !editDriverAddressCopy)
                            "
                          />
                        </div>
                        <TooltipProvider v-else>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <Edit
                                class="w-5 h-5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                @click.preven="
                                  () => (editDriverBankCopy = !editDriverBankCopy)
                                "
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
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
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
                        <div v-if="editDriverBankCopy" class="flex gap-4 items-center">
                          <UploadButton
                            class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
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
                            class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.preven="
                              () => (editDriverBankCopy = !editDriverBankCopy)
                            "
                          />
                        </div>
                        <TooltipProvider v-else>
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <Edit
                                class="w-5 h-5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                @click.preven="
                                  () => (editDriverBankCopy = !editDriverBankCopy)
                                "
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
              <h2 class="my-6 font-bold text-xl">Histórico de Atendimentos</h2>
              <div class="mb-6 p-6 flex items-center justify-center rounded-md bg-white">
                <p class="text-zinc-400">Nenhum histórico encontrado</p>
              </div>
            </section>
            <section class="my-10">
              <h2 class="my-6 font-bold text-xl">Faturas</h2>
              <div class="mb-6 p-6 flex items-center justify-center rounded-md bg-white">
                <p class="text-zinc-400">Nenhuma fatura encontrada</p>
              </div>
            </section>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold">Painel de Controle</h2>
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
