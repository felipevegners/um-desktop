<script setup lang="ts">
definePageMeta({
  layout: "admin",
});
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { ArrowLeft, LoaderCircle, LockKeyholeOpen, LockKeyhole, Download, Eye, Edit, File, Check, X, Search } from "lucide-vue-next";
import { dateFormat } from "~/lib/utils";
import { userDriverStore } from "~/stores/admin/drivers.store";
import { storeToRefs } from "pinia";
import AddCarsForm from "~/components/admin/drivers/AddCarsForm.vue";
import FormSelect from "~/components/shared/FormSelect.vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { findAddressByZipcode } from "~/server/services/FindAddress";

const { toast } = useToast();

const driverStore = userDriverStore();
const { loadingData, loadingSend } = storeToRefs(driverStore);
const { getDriverByIdAction, updateDriverAction } = driverStore;

const route = useRoute();

const fetchDriverData = async () => {
  return await getDriverByIdAction(route.params.id as string);
};

const driverData = ref();
driverData.value = await fetchDriverData();
const editDriverPicture = ref(false)
const editDriverCnhCopy = ref(false)
const editDriverAddressCopy = ref(false)
const editDriverBankCopy = ref(false)
const zipcode = ref(driverData.value.address.zipcode);
const isLoadingAddress = ref<boolean>(false);

useHead({
  title: `Editando motorista ${driverData.value.name} | Urban Mobi`
});

const driverSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    phone: z.string().min(2).max(50),
    document: z.string().min(2).max(50),
    driverLicense: z.string().min(2).max(50),
    zipcode: z.string().min(2).max(50),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    complement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    rideArea: z.string().min(2).max(200),
    status: z.string().min(2).max(50),
    enabled: z.boolean(),
  })
);

const driversForm = useForm({
  validationSchema: driverSchema,
  initialValues: {
    ...driverData.value,
    zipcode: driverData.value.address.zipcode,
    streetName: driverData.value.address.streetName,
    streetNumber: driverData.value.address.streetNumber,
    complement: driverData.value.address.complement,
    neighborhood: driverData.value.address.neighborhood,
    city: driverData.value.address.city,
    state: driverData.value.address.state,
  }
});

const onSubmit = driversForm.handleSubmit(async (values) => {
  const newDriverData = {
    id: driverData.value.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    document: values.document,
    driverLicense: values.driverLicense,
    driverCars: driverData.value.driverCars,
    driverFiles: driverData.value.driverFiles,
    address: {
      zipcode: values.zipcode,
      streetName: values.streetName,
      streetNumber: values.streetNumber,
      complement: values.complement,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state
    },
    rating: ["1"],
    history: [],
    status: values.status,
    enabled: values.enabled
  }

  try {
    //@ts-ignore
    await updateDriverAction(newDriverData)
  } catch (error) {
    toast({
      title: "Oops!",
      class: "bg-red-600 border-0 text-white text-2xl",
      description: `Ocorreu um erro ${error} ao adicionar o motorista.`
    });
  } finally {
    toast({
      title: "Sucesso!",
      class: "bg-green-600 border-0 text-white text-2xl",
      description: `O motorista ${values.name} foi cadastrado com sucesso!`
    });
    driversForm.values = newDriverData
    navigateTo("/admin/drivers");
  }

})

const findAddress = async () => {
  const { zipcode } = driversForm.values

  if (zipcode?.length !== 8) {
    toast({
      title: "Opss!",
      class: "bg-red-500 border-0 text-white text-2xl",
      description: `CEP inválido. Digite novamente.`
    });
  } else {
    try {
      isLoadingAddress.value = true;
      const address: any = await findAddressByZipcode(zipcode as string)
      if (address.erro) {
        toast({
          title: "CEP Inválido",
          class: "bg-red-500 border-0 text-white text-2xl",
          description: `Confira o CEP e tente novamente.`
        });
        //@ts-ignore
        document.querySelector("input[name='zipcode']").focus();
        document.querySelector("input[name='zipcode']")?.classList.add("bg-red-300", "focus:ring-0", "focus-visible:ring-0", "focus-visible:outline-3", "focus-visible:outline-offset-2", "focus-visible:outline-red-500");
      } else {
        document.querySelector("input[name='zipcode']")?.classList.remove("bg-red-300", "focus-visible:ring-0", "focus-visible:outline-3", "focus-visible:outline-offset-2", "focus-visible:outline-red-500");
        driversForm.setValues({
          zipcode: address?.cep.replace('-', ''),
          streetName: address?.logradouro,
          city: address?.localidade,
          neighborhood: address?.bairro,
          state: address?.estado,
        })
      }
    } catch (error) {
      toast({
        title: "Opss!",
        class: "bg-red-500 border-0 text-white text-2xl",
        description: `Ocorreu um erro ao buscar o endereço. Tente novamente.`
      });
      console.log("Erro ao buscar endereço -> ", error)
    } finally {
      isLoadingAddress.value = false
    }
  }

}
</script>

<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/drivers" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section v-if="loadingData" class="p-10 h-40 flex items-center justify-center bg-zinc-200 rounded-md">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mb-4 py-4">
      <h1 class="text-3xl font-bold mb-4">Editar Motorista</h1>
      <Card class="bg-zinc-200">
        <CardHeader>
          <div class="flex gap-4 justify-between">
            <div class="flex gap-6">
              <img v-if="driverData.driverFiles.picture.url" class="w-[150px] rounded-md"
                :src="driverData.driverFiles.picture.url" alt="">
              <div v-else class="w-[150px] h-[100px] bg-zinc-500 rounded-md">SEM IMAGEM</div>
              <div class="flex flex-col">
                <h1 class="mb-2 text-3xl font-bold">{{ driverData.name }}</h1>
                <div class="flex flex-col">
                  <small class="text-zinc-500">Cadastrado em:</small>
                  <p class="mb-2 font-bold">
                    {{ dateFormat(driverData.createdAt) }}
                  </p>
                  <small class="text-zinc-500">Modificado em:</small>
                  <p class="font-bold">
                    {{ dateFormat(driverData.updatedAt) }}
                  </p>
                </div>

              </div>
            </div>
            <div>
              <small class="text-zinc-500">Status:</small>
              <h1 class="text-2xl font-bold">{{ driverData.status === "active" ? "Ativo" : "Inativo" }}</h1>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
            <h2 class="mt-4 mb-6 text-lg font-bold">Dados Pessoais</h2>
            <div class="mb-4 w-full grid grid-cols-3 gap-8">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: João Silva" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="joao_silva@email.com.br" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex.: (11) 99876-5432" v-bind="componentField" />
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
                    <Input type="text" placeholder="222.333.444-56" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="driverLicense">
                <FormItem class="col-span-1">
                  <FormLabel>Número CNH</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="ex. 23456789019" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="status">
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <FormSelect v-bind="componentField" :items="[
                      { label: 'Ativo', value: 'active' },
                      { label: 'Inativo', value: 'inactive' },
                    ]" :label="'Selecione'" />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
            <section class="my-10">
              <h2 class="mt-4 mb-6 text-lg font-bold">Endereço e Área de Atuação</h2>
              <div class="mb-4 w-full grid grid-cols-4 gap-8">
                <FormField v-slot="{ componentField }" name="zipcode">
                  <FormItem class="col-span-1">
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <div class="flex gap-2">
                        <Input type="text" placeholder="12345-000" v-bind="componentField" v-model="zipcode"
                          maxlength="8" />
                        <Button @click.prevent="findAddress" :disabled="zipcode?.length !== 8" type="button">
                          <Search v-if="!isLoadingAddress" class="w-10 h-10" />
                          <LoaderCircle v-if="isLoadingAddress" class="w-10 h-10 animate-spin" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="streetName">
                  <FormItem class="col-span-1">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Insira o nome da rua" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="streetNumber">
                  <FormItem class="col-span-1">
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="ex. 1376" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="complement">
                  <FormItem class="col-span-1">
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="ex. BL A - AP 11" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="neighborhood">
                  <FormItem class="col-span-1">
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="ex.: Vila Santana" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="city">
                  <FormItem class="col-span-1">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="ex.: São Paulo" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="state">
                  <FormItem class="col-span-1">
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="ex.: São Paulo" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="rideArea">
                  <FormItem class="col-span-1">
                    <FormLabel>Área de atuação</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="ex.: São Paulo, Jundiaí, Campinas" v-bind="componentField" />
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
                <AddCarsForm v-model="driverData.driverCars" class="col-span-3" />
              </div>
            </section>
            <section class="mt-6 mb-8">
              <h2 class="mb-4 text-lg font-bold">Documentos</h2>
              <div class="flex">
                <ul class="w-full">
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
                        <p>Foto pessoal: <span class="text-zinc-500 underline">{{ driverData.driverFiles?.picture?.name
                            }}</span>
                        </p>
                        <Check v-if="driverData.driverFiles?.picture?.name" class="w-5 h-5 text-green-500" />
                      </div>
                      <div class="flex gap-4">
                        <div class="flex items-center gap-4 border-separate">
                          <small class="text-small">Ações:</small>
                          <a v-if="driverData.driverFiles?.picture?.name" target="_blank"
                            :href="driverData?.driverFiles?.picture?.url" alt="Visualizar">
                            <Eye class="w-5 h-5 text-zinc-700" />
                          </a>
                          <div v-if="editDriverPicture" class="flex gap-4 items-center">
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
                                    if (isUploading) return 'Enviando seu arquivo, aguarde...';
                                  },
                                },
                                endpoint: 'driverFiles',
                                onClientUploadComplete: (file) => {
                                  driverData.driverFiles.picture.name = file[0].name
                                  driverData.driverFiles.picture.url = file[0].ufsUrl
                                  editDriverPicture = !editDriverPicture
                                  toast({
                                    title: 'Feito!',
                                    class: 'bg-green-500 border-0 text-white text-2xl',
                                    description: `Arquivo enviado com sucesso!`
                                  });
                                },
                                onUploadError: (error) => {
                                  toast({
                                    title: 'Oops!',
                                    class: 'bg-red-500 border-0 text-white text-2xl',
                                    description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`
                                  });
                                },
                              }" />
                            <X class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                              @click.prevent="() => editDriverPicture = !editDriverPicture" />

                          </div>
                          <Edit v-else class="w-5 h-5 text-zinc-700 cursor-pointer"
                            @click.preven="() => editDriverPicture = !editDriverPicture" />
                        </div>
                      </div>
                    </div>
                  </li>
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
                        <p>
                          Cópia CNH:
                          <span class="text-zinc-500 underline">{{ driverData.driverFiles?.cnhCopy?.name
                            }}</span>
                        </p>
                        <Check v-if="driverData.driverFiles?.cnhCopy?.name" class="w-5 h-5 text-green-500" />
                      </div>
                      <div class="flex items-center gap-4 border-separate">
                        <small class="text-small">Ações:</small>
                        <a v-if="driverData.driverFiles?.cnhCopy?.name" target="_blank"
                          :href="driverData.driverFiles.cnhCopy.url" alt="Visualizar">
                          <Eye class="w-5 h-5 text-zinc-700" />
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
                                  if (isUploading) return 'Enviando seu arquivo, aguarde...';
                                },
                              },
                              endpoint: 'driverFiles',
                              onClientUploadComplete: (file) => {
                                driverData.driverFiles.cnhCopy.name = file[0].name
                                driverData.driverFiles.cnhCopy.url = file[0].ufsUrl
                                editDriverCnhCopy = !editDriverCnhCopy;
                                toast({
                                  title: 'Feito!',
                                  class: 'bg-green-500 border-0 text-white text-2xl',
                                  description: `Arquivo enviado com sucesso!`
                                });
                              },
                              onUploadError: (error) => {
                                toast({
                                  title: 'Oops!',
                                  class: 'bg-red-500 border-0 text-white text-2xl',
                                  description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`
                                });
                              },
                            }" />
                          <X class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.preven="() => editDriverCnhCopy = !editDriverCnhCopy" />

                        </div>
                        <Edit v-else class="w-5 h-5 text-zinc-700 cursor-pointer"
                          @click.preven="() => editDriverCnhCopy = !editDriverCnhCopy" />
                      </div>
                    </div>
                  </li>
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
                        <p>
                          Comprovante de Endereço:
                          <span class="text-zinc-500 underline">{{ driverData.driverFiles?.addressCopy?.name
                            }}</span>
                        </p>
                        <Check v-if="driverData.driverFiles?.addressCopy?.name" class="w-5 h-5 text-green-500" />
                      </div>
                      <div class="flex items-center gap-4 border-separate">
                        <small class="text-small">Ações:</small>
                        <a v-if="driverData.driverFiles?.addressCopy?.name" target="_blank"
                          :href="driverData.driverFiles.addressCopy?.url" alt="Visualizar">
                          <Eye class="w-5 h-5 text-zinc-700" />
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
                                  if (isUploading) return 'Enviando seu arquivo, aguarde...';
                                },
                              },
                              endpoint: 'driverFiles',
                              onClientUploadComplete: (file) => {
                                driverData.driverFiles.addressCopy.name = file[0].name
                                driverData.driverFiles.addressCopy.url = file[0].ufsUrl
                                editDriverAddressCopy = !editDriverAddressCopy;
                                toast({
                                  title: 'Feito!',
                                  class: 'bg-green-500 border-0 text-white text-2xl',
                                  description: `Arquivo enviado com sucesso!`
                                });
                              },
                              onUploadError: (error) => {
                                toast({
                                  title: 'Oops!',
                                  class: 'bg-red-500 border-0 text-white text-2xl',
                                  description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`
                                });
                              },
                            }" />
                          <X class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.preven="() => editDriverAddressCopy = !editDriverAddressCopy" />

                        </div>
                        <Edit v-else class="w-5 h-5 text-zinc-700 cursor-pointer"
                          @click.preven="() => editDriverAddressCopy = !editDriverAddressCopy" />
                      </div>
                    </div>
                  </li>
                  <li class="mb-2 p-4 bg-white border border-zinc-300">
                    <div class="flex gap-2 items-center justify-between">
                      <div class="flex gap-2">
                        <File class="w-5 h-5 text-zinc-700" />
                        <p>
                          Comprovante Bancário:
                          <span class="text-zinc-500 underline">{{ driverData.driverFiles?.bankCopy?.name
                            }}</span>
                        </p>
                        <Check v-if="driverData.driverFiles?.bankCopy?.name" class="w-5 h-5 text-green-500" />
                      </div>
                      <div class="flex items-center gap-4 border-separate">
                        <small class="text-small">Ações:</small>
                        <a v-if="driverData.driverFiles?.bankCopy?.name" target="_blank"
                          :href="driverData.driverFiles.bankCopy?.url" alt="Visualizar">
                          <Eye class="w-5 h-5 text-zinc-700" />
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
                                  if (isUploading) return 'Enviando seu arquivo, aguarde...';
                                },
                              },
                              endpoint: 'driverFiles',
                              onClientUploadComplete: (file) => {
                                driverData.driverFiles.bankCopy.name = file[0].name
                                driverData.driverFiles.bankCopy.url = file[0].ufsUrl
                                editDriverBankCopy = !editDriverBankCopy;
                                toast({
                                  title: 'Feito!',
                                  class: 'bg-green-500 border-0 text-white text-2xl',
                                  description: `Arquivo enviado com sucesso!`
                                });
                              },
                              onUploadError: (error) => {
                                toast({
                                  title: 'Oops!',
                                  class: 'bg-red-500 border-0 text-white text-2xl',
                                  description: `Ocorreu um erro no upload do arquivo. Tente novamente - ${error.cause}`
                                });
                              },
                            }" />
                          <X class="w-5 h-5 text-zinc-500 hover:text-red-500 cursor-pointer"
                            @click.preven="() => editDriverBankCopy = !editDriverBankCopy" />

                        </div>
                        <Edit v-else class="w-5 h-5 text-zinc-700 cursor-pointer"
                          @click.preven="() => editDriverBankCopy = !editDriverBankCopy" />
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </section>
            <section class="p-6 flex gap-8 rounded-md border-4 border-red-500 bg-white">
              <h2 class="font-bold">Acesso ao sistema</h2>
              <FormField v-slot="{ value, handleChange }" name="enabled">
                <FormItem>
                  <div class="flex items-center space-x-3">
                    <Label for="enabled" class="text-md flex gap-2 items-center">
                      <LockKeyhole />
                      <small>Negado</small>
                    </Label>
                    <FormControl>
                      <Switch :checked="value" aria-readonly @update:checked="handleChange" />
                    </FormControl>
                    <Label for="enabled" class="text-md flex gap-2 items-center">
                      <LockKeyholeOpen />
                      <small>Permitido</small>
                    </Label>
                  </div>
                </FormItem>
              </FormField>
            </section>
            <section class="pt-8">
              <Button type="submit">
                <LoaderCircle v-if="loadingSend" class="w-10 h-10 animate-spin" />
                Salvar alterações
              </Button>
              <Button variant="ghost" class="ml-4" @click.prevent="navigateTo('/admin/drivers')">
                Cancelar
              </Button>
            </section>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
