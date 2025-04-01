<script setup lang="ts">
import DataTable from '@/components/shared/DataTable.vue';
import DeleteAction from '@/components/shared/DeleteAction.vue';
import { useToast } from '@/components/ui/toast';
import { deleteServiceProfileService } from '@/server/services/services';
import { createColumnHelper } from '@tanstack/vue-table';
import { toTypedSchema } from '@vee-validate/zod';
import { BriefcaseBusiness, LoaderCircle, Plus } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';

import { columns } from './columns';

const { toast } = useToast();

definePageMeta({
  layout: 'admin',
  middleware: 'sidebase-auth',
});

defineOptions({
  name: 'Services',
});

useHead({
  title: 'Backoffice - Serviços | Urban Mobi',
});

const isLoading = ref<boolean>(false);
const isLoadingSend = ref<boolean>(false);
const showAddForm = ref<boolean>(false);
const servicesList = ref<any>([]);

const fetchData = async () => {
  try {
    isLoading.value = true;
    return await $fetch('/api/services/services');
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar o serviço. Tente novamente.`,
    });
    throw error;
  } finally {
    isLoading.value = false;
  }
};

servicesList.value = await fetchData();
const formSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(2, 'Insira um nome com mais de 2 caracteres')
      .max(50, 'O nome deve conter no máximo 50 caracteres'),
    price: z.string().min(1),
    description: z.string().min(2).max(100),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  isLoadingSend.value = true;
  try {
    await $fetch('/api/services/services', {
      method: 'POST',
      body: {
        ...values,
        enabled: true,
      },
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao cadastrar o serviço. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Serviço cadastrado com sucesso!`,
    });
    showAddForm.value = !showAddForm.value;
    servicesList.value = await fetchData();
  }
});

const deleteService = async (serviceId: string) => {
  isLoadingSend.value = true;
  try {
    await deleteServiceProfileService(serviceId);
  } catch (error) {
    toast({
      title: 'Opss!',
      class: 'bg-red-500 border-0 text-white text-2xl',
      description: `Ocorreu um erro ao deletar o serviço. Tente novamente.`,
    });
  } finally {
    isLoadingSend.value = false;
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Serivço deletado com sucesso!`,
    });
    servicesList.value = await fetchData();
  }
};

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
};

const columnHelper = createColumnHelper<any>();

const finalColumns = [
  ...columns,
  columnHelper.display({
    id: 'actions',
    enableHiding: false,
    header: () => h('div', { class: 'text-left' }, 'Ações'),
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'relative text-left' },
        h(DeleteAction, {
          data: row.original,
          loading: isLoadingSend.value,
          remove: deleteService,
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
        <BriefcaseBusiness />
        Serviços Cadastrados
      </h1>
      <Button @click="toggleShowAddForm">
        <Plus class="w-4 h-4" /> Novo Serviço
      </Button>
    </section>
    <section v-if="showAddForm" class="mb-4 py-4">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Cadastrar novo serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit" @keydown.enter.prevent="true">
            <div class="mb-4 md:grid md:grid-cols-2 md:gap-6">
              <FormField v-slot="{ componentField, errors }" name="name">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="price">
                <FormItem>
                  <FormLabel>Valor Padrão (R$)</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
            <div>
              <FormField v-slot="{ componentField }" name="description">
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input type="text" v-bind="componentField" />
                    <FormMessage />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>
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
        :columns="finalColumns"
        :data="servicesList"
        sortby="name"
        :column-pin="['name']"
        filterBy="nome do serviço"
      />
    </section>
  </main>
</template>

<style scoped></style>
