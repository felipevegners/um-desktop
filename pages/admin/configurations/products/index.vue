<script setup lang="ts">
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import DataTable from '@/components/shared/DataTable.vue';
import FormSelect from '@/components/shared/FormSelect.vue';
import TableActions from '@/components/shared/TableActions.vue';
import { useToast } from '@/components/ui/toast';
import { createColumnHelper } from '@tanstack/vue-table';
import { toTypedSchema } from '@vee-validate/zod';
import { Box, LoaderCircle, Plus } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import { deleteProductService, getProductsService } from '~/server/services/products';

import { columns } from './columns';

const { toast } = useToast();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

defineOptions({
  name: 'Products',
});

useHead({
  title: 'Backoffice - Gerenciar Produtos Produtos | Urban Mobi',
});

const isLoading = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);
const showAddForm = ref<boolean>(false);
const productsList = ref<any>([]);
const productType = ref<string>('');

const fetchData = async (productId: string) => {
  try {
    isLoading.value = true;
    if (productId) {
      return await getProductsService(productId);
    }
    return await getProductsService('');
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao carregar os produtos. Tente novamente.`,
    });
    throw error;
  } finally {
    isLoading.value = false;
  }
};

productsList.value = await fetchData('');

const formSchema = toTypedSchema(
  z.object({
    code: z
      .string({ message: '*Obrigatório' })
      .min(1, 'Insira pelo menos 1 caracter')
      .max(10, 'Máximo 10 caracteres'),
    name: z
      .string({ message: '*Obrigatório' })
      .min(2, 'Insira um nome com mais de 2 caracteres')
      .max(50, 'O nome deve conter no máximo 50 caracteres'),
    capacity: z.number({ message: '*Obrigatório' }).min(1),
    description: z.string().optional(),
    type: z.string({ message: '*Obrigatório' }),
    basePrice: z.string({ message: '*Obrigatório' }).min(1).optional(),
    includedHours: z.string({ message: '*Obrigatório' }).min(1).optional(),
    includedKms: z.number({ message: '*Obrigatório' }).min(1).optional(),
    kmPrice: z.string({ message: '*Obrigatório' }).min(1),
    minutePrice: z.string({ message: '*Obrigatório' }).min(1),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoadingSend.value = true;
  try {
    await $fetch('/api/products', {
      method: 'POST',
      body: {
        code: values.code,
        name: values.name,
        capacity: values.capacity,
        description: values.description,
        type: productType.value,
        basePrice: values.basePrice?.replace(',', '.'),
        includedHours: values.includedHours || '0',
        includedKms: values.includedKms || 0,
        kmPrice: values.kmPrice.replace(',', '.'),
        minutePrice: values.minutePrice.replace(',', '.'),
        enabled: true,
      },
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar o produto. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Produto cadastrado com sucesso!`,
    });
    showAddForm.value = !showAddForm.value;
    productsList.value = await fetchData('');
  }
});

const deleteProduct = async (productId: string) => {
  isLoadingSend.value = true;
  try {
    await deleteProductService(productId);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao deletar o produto. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Produto deletado com sucesso!`,
    });
    productsList.value = await fetchData('');
  }
};

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
  productType.value = '';
};

const columnHelper = createColumnHelper<any>();

const editProduct = (value: string) => {
  navigateTo({
    name: 'admin-configurations-products-edit-id',
    params: {
      id: value,
    },
  });
};

const finalColumns = [
  ...columns,
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-center text-xs' }, 'Ações'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'relative text-center' },
        h(TableActions, {
          dataId: row.original.id,
          options: ['edit', 'delete'],
          onEdit: editProduct,
          onDelete: deleteProduct,
        }),
      );
    },
  }),
];
</script>
<template>
  <main class="p-6">
    <section class="mb-6 flex items-center justify-between">
      <h1 class="flex items-center gap-4 text-2xl font-bold">
        <Box />
        Produtos Cadastrados
      </h1>
      <Button @click="toggleShowAddForm"> <Plus class="w-4 h-4" /> Novo Produto </Button>
    </section>
    <section v-if="showAddForm" class="mb-4 py-4">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Criar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
            <div class="mb-4 md:grid md:grid-cols-4 md:gap-6">
              <FormField v-slot="{ componentField }" name="image">
                <FormItem>
                  <FormLabel>Imagem</FormLabel>
                  <FormControl>
                    <Input type="file" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="capacity">
                <FormItem>
                  <FormLabel>Capacidade</FormLabel>
                  <FormControl>
                    <Input type="number" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="description">
                <FormItem>
                  <FormLabel>
                    Descrição
                    <small class="text-muted-foreground">*opcional</small>
                  </FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="type">
                <FormItem>
                  <FormLabel>Tipo de Cobrança</FormLabel>
                  <FormControl>
                    <FormSelect
                      :items="[
                        { label: 'Valor Fechado', value: 'contract' },
                        { label: 'Km e Minuto', value: 'free' },
                        { label: 'Km', value: 'free-km' },
                      ]"
                      v-model="productType"
                      label="Selecione o tipo"
                      v-bind="componentField"
                    />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
            <div
              class="p-6 border-2 border-zinc-700 rounded-md"
              v-if="productType === 'contract'"
            >
              <h3 class="mb-4 font-bold text-lg">Inserir Valores</h3>
              <div class="md:grid md:grid-cols-4 gap-4">
                <FormField v-slot="{ componentField }" name="basePrice">
                  <CurrencyInput :componentField="componentField" label="Valor Base" />
                </FormField>
                <FormField v-slot="{ componentField }" name="includedHours">
                  <FormItem>
                    <FormLabel>Franquia Horas</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="includedKms">
                  <FormItem>
                    <FormLabel>Franquia KMs</FormLabel>
                    <FormControl>
                      <Input type="number" v-bind="componentField" />
                      <FormMessage />
                    </FormControl>
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="kmPrice">
                  <CurrencyInput
                    :componentField="componentField"
                    label="Valor KM Adicional"
                  />
                </FormField>
                <FormField v-slot="{ componentField }" name="minutePrice">
                  <CurrencyInput
                    :componentField="componentField"
                    label="Valor Minuto Adicional"
                  />
                </FormField>
              </div>
            </div>
            <div
              v-if="productType === 'free' || productType === 'free-km'"
              class="p-6 border-2 border-zinc-700 rounded-md"
            >
              <h3 class="mb-4 font-bold text-lg">Inserir Valores</h3>

              <div class="md:grid md:grid-cols-4 gap-4">
                <FormField v-slot="{ componentField }" name="basePrice">
                  <CurrencyInput :componentField="componentField" label="Valor Base" />
                </FormField>
                <FormField v-slot="{ componentField }" name="kmPrice">
                  <CurrencyInput :componentField="componentField" label="Valor KM" />
                </FormField>
                <FormField v-slot="{ componentField }" name="minutePrice">
                  <CurrencyInput :componentField="componentField" label="Valor Minuto" />
                </FormField>
              </div>
            </div>
            <div v-if="productType !== ''" class="mt-6">
              <Button type="submit">
                <LoaderCircle v-if="isLoadingSend" class="w-10 h-10 animate-spin" />
                Cadastrar
              </Button>
              <Button variant="ghost" class="ml-4" @click.prevent="toggleShowAddForm">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable
        :columns="finalColumns"
        :data="productsList"
        sortby="name"
        :column-pin="['image']"
        filterBy="nome do produto"
      />
    </section>
  </main>
</template>

<style scoped></style>
