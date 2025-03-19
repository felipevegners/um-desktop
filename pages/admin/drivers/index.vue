<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast/use-toast';
import { createColumnHelper } from '@tanstack/vue-table';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowUpDown, LoaderCircle, Plus, Info, Search } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useForm } from 'vee-validate';
import { onMounted, ref } from 'vue';
import * as z from 'zod';
import AddCarsForm from '~/components/admin/drivers/AddCarsForm.vue';
import EditDeleteActions from '~/components/admin/drivers/EditDeleteActions.vue';
import FormSelect from '~/components/shared/FormSelect.vue';
import { findAddressByZipcode } from '~/server/services/FindAddress';
import { userDriverStore } from '~/stores/admin/drivers.store';

const { toast } = useToast();

const driverStore = userDriverStore();
const { loadingData, drivers, loadingSend } = storeToRefs(driverStore);
const { getDriversAction, createNewDriverAction, deleteDriverAction } =
  driverStore;

definePageMeta({
  layout: 'admin',
});

useHead({
  title: 'Motoristas ativos | Urban Mobi',
});

const showAddForm = ref<boolean>(false);
const isLoadingAddress = ref<boolean>(false);
const isLoadingSend = ref(false);
const zipcode = ref('');
const driverCars = reactive([
  {
    carModel: '',
    carColor: '',
    carPlate: '',
    carYear: '',
    carDocumentFile: {
      name: '',
      url: ''
    }
  },
]);



onMounted(async () => {
  await getDriversAction();
});

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
};

const handleDeleteDriver = async (id: string) => {
  await deleteDriverAction(id);
};

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor('name', {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          onClick: () =>
            column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('name')),
  }),
  columnHelper.accessor('email', {
    header: () => h('div', { class: 'text-left' }, 'E-mail'),
    cell: ({ row }) =>
      h('div', { class: 'lowercase' }, row.getValue('email')),
  }),
  columnHelper.accessor('phone', {
    header: () => h('div', { class: 'text-left' }, 'Celular'),
    cell: ({ row }) =>
      h('div', { class: 'capitalize' }, row.getValue('phone')),
  }),
  columnHelper.accessor('document', {
    header: () => h('div', { class: 'text-left' }, 'CPF'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-left font-medium' },
        row.getValue('document')
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
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${status === 'active' ? 'bg-green-600' : 'bg-red-600'
            }`,
        },
        status === 'active' ? 'Ativo' : 'Inativo'
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
          class: `px-1 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${enabled === true ? 'bg-blue-600' : 'bg-zinc-600'
            }`,
        },
        enabled === true ? 'Permitido' : 'Negado'
      );
    },
  }),

  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      const driverData = row.original;
      return h(
        'div',
        { class: 'relative text-left' },
        h(EditDeleteActions, {
          data: driverData,
          remove: handleDeleteDriver,
          formControl: toggleShowAddForm,
        })
      );
    },
  }),
];

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
    name: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    phone: z.string().min(2).max(50),
    document: z.string().min(2).max(50),
    driverLicense: z.string().min(2).max(50),
    zipcode: z.string().min(2).max(50),
    streetName: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    addComplement: z.string().min(0).max(50),
    neighborhood: z.string().min(2).max(50),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    rideArea: z.string().min(2).max(200),
    status: z.string().min(2).max(50),
    picture: z
      .any()
      .refine(
        (file) => file?.size <= MAX_FILE_SIZE,
        `Tamanho máximo é de 5Mb.`
      )
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos '
      ),
    cnhCopy: z
      .any()
      .refine(
        (file) => file?.size <= MAX_FILE_SIZE,
        `Tamanho máximo é de 5Mb.`
      )
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos '
      ),
    addressCopy: z
      .any()
      .refine(
        (file) => file?.size <= MAX_FILE_SIZE,
        `Tamanho máximo é de 5Mb.`
      )
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos '
      ),
    bankCopy: z
      .any()
      .refine(
        (file) => file?.size <= MAX_FILE_SIZE,
        `Tamanho máximo é de 5Mb.`
      )
      .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        'Apenas arquivos nos formatos .jpg, .jpeg, .png, .webp ou PDF são aceitos '
      ),
  })
);

const driversForm = useForm({
  validationSchema: driverSchema,
});

const { startUpload } = useUploadThing('driverFiles', {
  //@ts-ignore
  onClientUploadComplete(res) {
    return res;
  },
});
const onSubmit = driversForm.handleSubmit(async (values) => {
  const files = [values.picture, values.cnhCopy, values.addressCopy, values.bankCopy];
  isLoadingSend.value = true;
  try {
    if (!files) return;
    const filesResponse = await startUpload(files);
    const newDriverData = {
      driverCars,
      name: values.name,
      email: values.email,
      phone: values.phone,
      document: values.document,
      driverLicense: values.driverLicense,
      address: {
        zipcode: values.zipcode,
        streetName: values.streetName,
        streetNumber: values.streetNumber,
        addComplement: values.addComplement,
        city: values.city,
        state: values.state
      },
      rideArea: values.rideArea,
      driverFiles: {
        picture: {
          //@ts-ignore
          name: filesResponse[0]?.name,
          //@ts-ignore
          url: filesResponse[0]?.ufsUrl,
        },
        cnhCopy: {
          //@ts-ignore
          name: filesResponse[1]?.name,
          //@ts-ignore
          url: filesResponse[1]?.ufsUrl,
        },
        addressCopy: {
          //@ts-ignore
          name: filesResponse[2]?.name,
          //@ts-ignore
          url: filesResponse[2]?.ufsUrl,
        },
        bankCopy: {
          //@ts-ignore
          name: filesResponse[3]?.name,
          //@ts-ignore
          url: filesResponse[3]?.ufsUrl,
        },
      },
      rating: ['1'],
      history: [],
      status: values.status,
      enabled: true,
    };
    await createNewDriverAction(newDriverData);

  } catch (error) {
    toast({
      title: 'Oops!',
      class: 'bg-red-600 border-0 text-white text-2xl',
      description: `Ocorreu um erro ${error} ao adicionar o motorista.`,
    });
  } finally {
    showAddForm.value = !showAddForm.value;
    toast({
      title: 'Sucesso!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `O motorista ${values.name} foi cadastrado com sucesso!`,
    });
    isLoadingSend.value = false;
    await getDriversAction();
  }
});

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
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Base de Motoristas</h1>
      <div>
        <Button @click="toggleShowAddForm">
          <Plus class="w-4 h-4" /> Cadastrar Motorista
        </Button>
      </div>
    </section>
    <section v-if="showAddForm" class="mb-4 py-4">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Cadastrar novo motorista</CardTitle>
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
                      {
                        label: 'Ativo',
                        value: 'active',
                      },
                      {
                        label: 'Inativo',
                        value: 'inactive',
                      },
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
                        <Button @click.prevent="findAddress" :disabled="zipcode.length !== 8" type="button">
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
                <FormField v-slot="{ componentField }" name="addComplement">
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
              <h2 class="mb-4 text-lg font-bold">
                Dados do(s) Veículo(s)
              </h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <AddCarsForm v-model="driverCars" class="col-span-3" />
              </div>
            </section>
            <section class="mt-6 mb-8">
              <h2 class="mb-4 text-lg font-bold">
                Enviar arquivos
              </h2>
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
                      <Input id="picture" type="file" @change="handleChange" @blur="handleBlur" />
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
                      <Input id="cnhCopy" type="file" @change="handleChange" @blur="handleBlur" />
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
                      <Input id="addressCopy" type="file" @change="handleChange" @blur="handleBlur" />
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
                            <p>Enviar comprovante dos dados bancário constando nome completo, agência e conta</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input id="bankCopy" type="file" @change="handleChange" @blur="handleBlur" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
            </section>
            <section class="pt-8">
              <Button type="submit">
                <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
                Cadastrar
              </Button>
              <Button variant="ghost" class="ml-4" @click.prevent="toggleShowAddForm">
                Cancelar
              </Button>
            </section>
          </form>
        </CardContent>
      </Card>
    </section>
    <section v-if="loadingData" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable :columns="columns" :data="drivers" sortby="name" :columnPin="['name']" />
    </section>
  </main>
</template>

<style scoped></style>
