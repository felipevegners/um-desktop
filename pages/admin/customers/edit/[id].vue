<script setup lang="ts">
import AddCorpUserForm from '@/components/admin/users/AddCorpUserForm.vue';
import EditDeleteActions from '@/components/admin/users/EditDeleteActions.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { useCustomerStore } from '@/stores/admin/customers.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { toTypedSchema } from '@vee-validate/zod';
import {
  ArrowLeft,
  ArrowUpDown,
  CircleX,
  LoaderCircle,
  LockKeyhole,
  LockKeyholeOpen,
  Paperclip,
  Plus,
  Search,
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { h, ref } from 'vue';
import * as z from 'zod';
import AddCCAreaForm from '~/components/admin/customers/AddCCAreaForm.vue';
import DataTable from '~/components/shared/DataTable.vue';
import Separator from '~/components/ui/separator/Separator.vue';
import { dateFormat } from '~/lib/utils';
import { findAddressByZipcode } from '~/server/services/FindAddress';
import { useFilesStore } from '~/stores/admin/files.store';
import { usePassengerStore } from '~/stores/admin/passengers.store';

definePageMeta({
  layout: 'admin',
});

const filesStore = useFilesStore();
const { deleteFileAction } = filesStore;

const { toast } = useToast();

const store = useCustomerStore();
const { getCustomerByIdAction, editCustomer } = store;

const passengerStore = usePassengerStore();
const { deletePassengerAction, resetPassengerState, toggleIsEditing, loading } =
  passengerStore;
const { isEditing } = storeToRefs(passengerStore);

const route = useRoute();
const isLoading = ref<boolean>(false);
const editCustomerData = ref<any>();

const fetchCustomerData = async () => {
  const data = await getCustomerByIdAction(route?.params?.id as string);
  editCustomerData.value = data;
  return data;
};
editCustomerData.value = await fetchCustomerData();

useHead({
  title: `Editar cliente ${editCustomerData.value.fantasyName} | Urban Mobi`,
});

const showAddPassengerForm = ref<boolean>(false);
const isLoadingAddress = ref<boolean>(false);
const loadingFileData = ref<boolean>(false);
const zipcode = ref(editCustomerData?.value.address?.zipcode);

const deletePassenger = async (id: string) => {
  await deletePassengerAction(id).then(() => fetchCustomerData());
};

const toggleAddPassengerForm = () => {
  showAddPassengerForm.value = !showAddPassengerForm.value;
};

const columnHelper = createColumnHelper<any>();

const passengerColumns = [
  columnHelper.accessor('name', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) => h('div', { class: 'capitalize' }, row.getValue('name')),
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Situação'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white ${
            status === 'active'
              ? 'bg-green-600'
              : status === 'inactive'
                ? 'bg-red-700'
                : 'bg-yellow-500'
          }`,
        },
        status === 'active'
          ? 'Ativo'
          : status === 'inactive'
            ? 'Inativo'
            : 'Pendente',
      );
    },
  }),
  columnHelper.accessor('position', {
    header: () => h('div', { class: 'text-left' }, 'Cargo'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('position')),
  }),
  columnHelper.accessor('department', {
    header: () => h('div', { class: 'text-left' }, 'CC/Depto.'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('department')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('email')),
  }),
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Telefone'),
    cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('phone')),
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const passengerData = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(EditDeleteActions, {
          data: passengerData,
          remove: deletePassenger,
          formControl: toggleAddPassengerForm,
        }),
      );
    },
  }),
];

const formSchema = toTypedSchema(
  z.object({
    status: z.string().min(2).max(50),
    name: z.string().min(2).max(100),
    document: z.string().min(2).max(50),
    fantasyName: z.string().min(2).max(50),
    zipcode: z.string().min(2).max(50),
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
    managerEmail: z.string().min(2),
    paymentTerm: z.string().min(2).max(12),
    paymentDueDate: z.number().min(0).max(30),
    enabled: z.boolean(),
  }),
);
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    status: editCustomerData?.value.status,
    name: editCustomerData?.value.name,
    document: editCustomerData?.value.document,
    fantasyName: editCustomerData?.value.fantasyName,
    zipcode: editCustomerData?.value.address?.zipcode,
    streetName: editCustomerData?.value.address?.streetName,
    streetNumber: editCustomerData?.value.address?.streetNumber,
    complement: editCustomerData?.value.address?.complement,
    neighborhood: editCustomerData?.value.address?.neighborhood,
    city: editCustomerData?.value.address?.city,
    state: editCustomerData?.value.address?.state,
    phone: editCustomerData?.value.phone,
    website: editCustomerData?.value.website,
    managerName: editCustomerData?.value.managerName,
    managerEmail: editCustomerData?.value.managerEmail,
    managerPhone: editCustomerData?.value.managerPhone,
    paymentTerm: editCustomerData?.value.billingInfo.billing,
    paymentDueDate: editCustomerData?.value.billingInfo.dueDate,
    enabled: editCustomerData.value.enabled,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const newCustomerData = {
    id: route?.params?.id,
    ccAreas: [...editCustomerData.value.ccAreas],
    logo: {
      name: editCustomerData.value.logo.name,
      url: editCustomerData.value.logo.url,
    },
    ...values,
  };
  isLoading.value = true;
  await editCustomer(newCustomerData)
    .then(() => {
      isLoading.value = false;
    })
    .catch((err) => {
      console.log('Error -> ', err);
      toast({
        title: 'Opss!',
        class: 'bg-red-500 border-0 text-white text-2xl',
        description: `Ocorreu um erro (${err.message}) ao cadastrar o cliente. Tente novamente.`,
      });
      alert('Erro ao cadastrar cliente');
    })
    .finally(() => {
      toast({
        title: 'Sucesso!',
        class: 'bg-green-600 border-0 text-white text-2xl',
        description: `A empresa ${newCustomerData.fantasyName} foi atualizada com sucesso!`,
      });
      navigateTo('/admin/customers');
    });
});

const deleteFile = async (url: string) => {
  try {
    await deleteFileAction(url);
  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Arquivo do logotipo não pode ser removido. Tente novamente.`,
    });
  } finally {
    toast({
      title: 'Feito!',
      class: 'bg-green-500 border-0 text-white text-2xl',
      description: `Arquivo do logotipo foi removido com sucesso!`,
    });
    editCustomerData.value.logo.name = '';
    editCustomerData.value.logo.url = '';
  }
};

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
</script>
<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/customers" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section
      v-if="loading"
      class="p-10 h-40 bg-zinc-200 flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else class="mb-6">
      <Card class="bg-zinc-200">
        <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
          <CardHeader>
            <div class="flex items-start justify-between">
              <CardTitle class="text-md"
                >Dados do Cliente
                <br />
                <span class="font-normal text-3xl">{{
                  editCustomerData.name
                }}</span>
                <div class="my-4">
                  <div class="mb-4 flex flex-col">
                    <small class="text-zinc-500">Cadastrado em:</small>
                    <p class="font-bold">
                      {{ dateFormat(editCustomerData.createdAt) }}
                    </p>
                  </div>
                  <div class="mb-2 flex flex-col">
                    <small class="text-zinc-500">Modificado em:</small>
                    <p class="font-bold">
                      {{ dateFormat(editCustomerData.updatedAt) }}
                    </p>
                  </div>
                </div>
              </CardTitle>
              <div class="px-4 bg-white rounded-md">
                <img
                  v-if="editCustomerData.logo?.url"
                  class="p-4 bg-white w-[150px]"
                  :src="editCustomerData.logo?.url"
                  alt=""
                />
                <div
                  v-else
                  class="flex items-center justify-center w-[150px] h-[150px] bg-white rounded-md text-zinc-400"
                >
                  SEM LOGO
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="mb-8 py-4 max-w-[200px]">
              <FormField v-slot="{ componentField }" name="status">
                <FormItem>
                  <FormLabel>Situação do Cadastro</FormLabel>
                  <FormControl>
                    <FormSelect
                      v-bind="componentField"
                      :items="[
                        { label: 'Aprovado', value: 'active' },
                        { label: 'Inativo', value: 'inactive' },
                        { label: 'Pendente', value: 'pending' },
                      ]"
                      :label="'Selecione o Status'"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-3 gap-8">
              <FormField v-slot="{ componentField }" name="document">
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Insira o nome"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="fantasyName">
                <FormItem>
                  <FormLabel>Nome Fantasia</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Insira o nome"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
              <FormField v-slot="{ componentField }" name="zipcode">
                <FormItem class="col-span-1">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <div class="flex gap-2">
                      <Input
                        type="text"
                        placeholder="12345-000"
                        v-bind="componentField"
                        v-model="zipcode"
                        maxlength="8"
                      />
                      <Button
                        @click.prevent="findAddress"
                        :disabled="zipcode?.length !== 8"
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
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="streetName">
                <FormItem class="col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Insira o endereço"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="streetNumber">
                <FormItem class="col-span-1">
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex. 1876"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="complement">
                <FormItem class="col-span-1">
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex.: Quadra 3, Bloco A, Setor 3B"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="neighborhood">
                <FormItem class="col-span-1">
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex.: Vila Santana"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="city">
                <FormItem class="col-span-1">
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex.: São Paulo"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="state">
                <FormItem class="col-span-1">
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="ex.: São Paulo"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="(11) 98765-4321"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="website">
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="www.empresa.com.br"
                      v-bind="componentField"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="logo">
                <FormItem>
                  <FormLabel>Logo da Empresa</FormLabel>
                  <FormControl>
                    <div class="flex gap-4">
                      <div v-if="!editCustomerData?.logo?.name">
                        <UploadButton
                          class="relative ut-button:bg-zinc-900 ut-button:hover:bg-zinc-700 ut-button:ut-uploading:after:bg-green-500 ut-button:ut-uploading:cursor-not-allowed ut-button:ut-readying:bg-red-500"
                          :config="{
                            appearance: {
                              container: '!items-start',
                              allowedContent: '!absolute !top-10',
                            },
                            content: {
                              allowedContent({
                                ready,
                                fileTypes,
                                isUploading,
                              }) {
                                if (ready) return '';
                                if (isUploading)
                                  return 'Enviando seu arquivo, aguarde...';
                              },
                            },
                            endpoint: 'customerLogo',
                            onClientUploadComplete: (file) => {
                              editCustomerData.logo.name = file[0].name;
                              editCustomerData.logo.url = file[0].ufsUrl;
                            },
                            onUploadError: (error) => {
                              toast({
                                title: 'Ooops!',
                                class:
                                  'bg-red-500 border-0 text-white text-2xl',
                                description: `Erro ao enviar o arquivo. Tente novamente. ${error.cause}`,
                              });
                            },
                          }"
                        />
                      </div>
                      <div
                        v-if="editCustomerData.logo?.name !== ''"
                        class="flex gap-2 items-center"
                      >
                        <Paperclip class="w-4 h-4 text-zinc-500" />
                        <div
                          class="px-4 py-2 border border-dashed border-zinc-500 rounded-md bg-white"
                        >
                          <a
                            class="underline"
                            :href="editCustomerData.logo?.url"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {{
                              editCustomerData.logo?.name ||
                              'Nenhum arquivo anexo'
                            }}
                          </a>
                        </div>
                        <LoaderCircle
                          v-if="loadingFileData"
                          class="w-4 h-4 animate-spin"
                        />
                        <CircleX
                          v-else
                          class="w-4 h-4 text-zinc-500 hover:text-red-500 cursor-pointer"
                          @click.prevent="
                            deleteFile(editCustomerData.logo?.url)
                          "
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <div class="mb-4 w-full grid grid-cols-3 gap-8"></div>
            <div class="my-10">
              <h2 class="mb-4 text-lg font-bold">Gerente da Conta</h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="managerName">
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Insira o nome do Gerente desta conta"
                        v-bind="componentField"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="managerPhone">
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="(11) 98765-4321"
                        v-bind="componentField"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="managerEmail">
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="nome@empresa.com.br"
                        v-bind="componentField"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
            <div class="my-10">
              <h2 class="mb-4 text-lg font-bold">Centro de Custo</h2>
              <AddCCAreaForm
                v-model="editCustomerData.ccAreas"
                class="col-span-3"
              />
            </div>
            <div class="my-6">
              <h2 class="mb-6 text-lg font-bold">Faturamento</h2>
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
                    <FormLabel>Prazo de Pagamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="ex.: 30"
                        v-bind="componentField"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </div>
            </div>
            <Separator class="my-6 border-b border-zinc-300" />
            <div class="my-6 flex">
              <h2 class="mb-6 mr-6 font-bold text-xl">Usuários Cadastrados</h2>
              <Button
                type="button"
                class="flex items-center justify-center"
                @click="
                  (event) => {
                    toggleAddPassengerForm();
                    resetPassengerState();
                    toggleIsEditing();
                  }
                "
                :disabled="isEditing"
              >
                <Plus class="w-4 h-4" /> Adicionar usuário
              </Button>
            </div>
            <section v-if="showAddPassengerForm">
              <AddCorpUserForm
                :isNewUser="false"
                :customerId="editCustomerData?.id"
                :customerName="editCustomerData?.name"
                :ccAreas="editCustomerData?.ccAreas"
                @show-form="toggleAddPassengerForm"
                @fetch-customer="fetchCustomerData"
              />
            </section>
            <section class="mb-6 px-4 rounded-md bg-white">
              <DataTable
                :columns="passengerColumns"
                :data="editCustomerData?.passengers || []"
                sortby="name"
              />
            </section>
            <h2 class="mb-6 font-bold text-xl">Pendências do Cliente</h2>
            <section
              v-if="editCustomerData.pendingItems === null"
              class="mb-6 p-6 flex items-center justify-center rounded-md bg-white"
            >
              <p class="text-zinc-400">Nenhuma pendência encontrada</p>
            </section>
            <section class="my-10">
              <h2 class="my-6 font-bold text-xl">Histórico de Atendimentos</h2>
              <div
                class="mb-6 p-6 flex items-center justify-center rounded-md bg-white"
              >
                <p class="text-zinc-400">Nenhum histórico encontrado</p>
              </div>
            </section>
            <section class="my-10">
              <h2 class="my-6 font-bold text-xl">Faturas</h2>
              <div
                class="mb-6 p-6 flex items-center justify-center rounded-md bg-white"
              >
                <p class="text-zinc-400">Nenhuma fatura encontrada</p>
              </div>
            </section>
            <section
              class="p-6 flex gap-8 rounded-md border-4 border-red-500 bg-white"
            >
              <h2 class="font-bold">Acesso ao sistema</h2>
              <FormField v-slot="{ value, handleChange }" name="enabled">
                <FormItem>
                  <div class="flex items-center space-x-3">
                    <Label
                      for="enabled"
                      class="text-md flex gap-2 items-center"
                    >
                      <LockKeyhole />
                      <small>Negado</small>
                    </Label>
                    <FormControl>
                      <Switch
                        :checked="value"
                        aria-readonly
                        @update:checked="handleChange"
                      />
                    </FormControl>
                    <Label
                      for="enabled"
                      class="text-md flex gap-2 items-center"
                    >
                      <LockKeyholeOpen />
                      <small>Permitido</small>
                    </Label>
                  </div>
                </FormItem>
              </FormField>
            </section>
          </CardContent>
          <CardFooter>
            <div class="mt-8 flex items-center">
              <Button type="submit">
                <LoaderCircle v-if="isLoading" class="w-10 h-10 animate-spin" />
                Salvar alterações
              </Button>
              <Button
                variant="ghost"
                class="ml-4"
                @click="navigateTo('/admin/customers')"
              >
                Cancelar
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </section>
  </main>
</template>

<style scoped></style>
