<script setup lang="ts">
import AddCCAreaForm from '@/components/admin/customers/AddCCAreaForm.vue';
import DataTableActions from '@/components/admin/customers/DataTableActions.vue';
import DataTable from '@/components/shared/DataTable.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { findAddressByZipcode } from '@/server/services/FindAddress';
import { useCustomerStore } from '@/stores/admin/customers.store';
import { createColumnHelper } from '@tanstack/vue-table';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowUpDown, LoaderCircle, Plus, Search } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { h, onMounted, reactive, ref } from 'vue';
import * as z from 'zod';

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Clientes Ativos | Urban Mobi',
});

const { toast } = useToast();

const customerStore = useCustomerStore();
const {
  getCustomersAction,
  getCustomerByIdAction,
  createNewCustomerAction,
  deleteCustomerAction,
  toggleDeleteModal,
} = customerStore;
const { customers, viewDeleteModal, customerToDelete, loading } =
  storeToRefs(customerStore);

const isLoading = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);
const isLoadingAddress = ref<boolean>(false);
const alertSuccess = ref<boolean>(false);
const showAddForm = ref<boolean>(false);
const deleteModalOpen = ref<boolean>(false);
const zipcode = ref('');

const ccAreas = reactive([{ areaCode: '', areaName: '' }]);

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
    managerEmail: z.string().min(2),
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

const { startUpload } = useUploadThing('customerLogo', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const files = [values?.logo];
  isLoadingSend.value = true;

  try {
    if (!files) return;
    const filesResponse = await startUpload(files);
    const {
      name,
      document,
      fantasyName,
      streetName,
      streetNumber,
      complement,
      neighborhood,
      city,
      state,
      zipcode,
      phone,
      website,
      managerName,
      managerPhone,
      managerEmail,
      paymentTerm,
      paymentDueDate,
    } = values;

    const newCustomerData = {
      name,
      document,
      fantasyName,
      address: {
        zipcode,
        streetName,
        streetNumber,
        complement,
        neighborhood,
        city,
        state,
      },
      billingInfo: {
        billing: paymentTerm,
        dueDate: paymentDueDate,
      },
      phone,
      website,
      logo: {
        //@ts-ignore
        name: filesResponse[0]?.name || '',
        //@ts-ignore
        url: filesResponse[0]?.ufsUrl || '',
      },
      adminId: '67bda5bd3e3ed4a5d2bdb799',
      managerName,
      managerPhone,
      managerEmail,
      ccAreas: [...ccAreas],
      status: 'pending',
      enabled: false,
    };

    await createNewCustomerAction(newCustomerData as any);
  } catch (error) {
    console.log('Error -> ', error);
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar o cliente. Tente novamente.`,
    });
  } finally {
    setTimeout(() => {}, 2000);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Empresa cadastrada com sucesso!`,
    });
    showAddForm.value = !showAddForm.value;
    await getCustomersAction();
  }
});

onMounted(async () => {
  isLoading.value = true;
  await getCustomersAction().then(() => {
    isLoading.value = false;
  });
});

const columnHelper = createColumnHelper<any>();

const handleDeleteModal = () => {
  deleteModalOpen.value = !deleteModalOpen.value;
};

const handleDeleteCustomer = async (id: string) => {
  await deleteCustomerAction(id);
};

const columns = [
  columnHelper.accessor('fantasyName', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome Fantasia', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('fantasyName')),
  }),
  columnHelper.accessor('document', {
    header: () => h('div', { class: 'text-left' }, 'CNPJ'),
    cell: ({ row }) =>
      h('div', { class: 'lowercase' }, row.getValue('document')),
  }),
  columnHelper.accessor('managerName', {
    header: () => h('div', { class: 'text-left' }, 'Gerente'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('managerName')),
  }),
  columnHelper.accessor('managerEmail', {
    header: () => h('div', { class: 'text-left' }, 'E-mail Gerente'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('managerEmail'),
      );
    },
  }),
  columnHelper.accessor('status', {
    header: () => h('div', { class: 'text-left' }, 'Status'),
    cell: ({ row }) => {
      const status = row.getValue('status');
      return h(
        'div',
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${
            status === 'active'
              ? 'bg-green-600'
              : status === 'inactive'
                ? 'bg-red-600'
                : 'bg-yellow-500'
          }`,
        },
        status === 'active'
          ? 'Aprovado'
          : status === 'inactive'
            ? 'Inativo'
            : 'Pendente',
      );
    },
  }),
  columnHelper.accessor('enabled', {
    header: () => h('div', { class: 'text-left' }, 'Acesso'),
    cell: ({ row }) => {
      const enabled = row.getValue('enabled');
      return h(
        'div',
        {
          class: `px-1 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${
            enabled === true ? 'bg-blue-600' : 'bg-zinc-600'
          }`,
        },
        enabled === true ? 'Liberado' : 'Negado',
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const customerData = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(DataTableActions, {
          customerData,
          isLoadingSend,
          deleteModalOpen,
          handleModal: handleDeleteModal,
          delete: handleDeleteCustomer,
          onExpand: row.toggleExpanded,
        }),
      );
    },
  }),
];

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
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
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Base de Clientes</h1>
      <div v-if="!showAddForm">
        <Button @click="toggleShowAddForm">
          <Plus class="w-4 h-4" /> Cadastrar cliente
        </Button>
      </div>
    </section>
    <section v-if="showAddForm" class="mb-4 py-4">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Cadastrar novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
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
                      placeholder="Insira a razão social"
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
                      placeholder="Insira o nome fantasia"
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
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="streetName">
                <FormItem class="col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Insira o nome da rua"
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
                      placeholder="ex. 1376"
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
            </div>
            <div class="mb-4 w-full grid grid-cols-3 gap-8">
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
                    <Input type="file" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            <section class="my-10">
              <h2 class="mb-4 text-lg font-bold">Gerente da Conta</h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="managerName">
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Insira o nome do Gerente Master"
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
            </section>
            <section class="my-6">
              <h2 class="mb-4 text-lg font-bold">Centro de Custo</h2>
              <AddCCAreaForm v-model="ccAreas" class="col-span-3" />
            </section>
            <section class="my-6">
              <h2 class="mb-4 text-lg font-bold">Faturamento</h2>
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
            </section>
            <section class="mt-6">
              <Button type="submit">
                <LoaderCircle
                  v-if="isLoadingSend"
                  class="w-10 h-10 animate-spin"
                />
                Cadastrar
              </Button>
              <Button
                variant="ghost"
                class="ml-4"
                @click.prevent="toggleShowAddForm"
              >
                Cancelar
              </Button>
            </section>
          </form>
        </CardContent>
      </Card>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="columns"
        :data="customers"
        sortby="fantasyName"
        :columnPin="['fantasyName']"
      />
    </section>

    <AlertDialog :open="viewDeleteModal">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            >Deseja realmente excluir:
            {{ customerToDelete.name }}?</AlertDialogTitle
          >
          {{ customerToDelete.id }}
          <AlertDialogDescription>
            Essa ação é irreversível e excluirá permanentemente da base de
            dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="toggleDeleteModal('')"
            >Cancelar</AlertDialogCancel
          >
          <AlertDialogAction
            class="bg-red-500 hover:bg-red-600"
            @click="handleDeleteCustomer(customerToDelete.id)"
          >
            <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>
</template>
