<script setup lang="ts">
definePageMeta({
  layout: "admin",
  title: "Editar cliente",
});

import { ref, h } from "vue";
import { useCustomerStore } from "@/stores/admin/customers.store";
import { usePassengerStore } from "~/stores/admin/passengers.store";
import FormSelect from "@/components/shared/FormSelect.vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import DataTable from "~/components/shared/DataTable.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  ArrowLeft,
  ArrowUpDown,
  Plus,
  LoaderCircle,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
} from "lucide-vue-next";
import Separator from "~/components/ui/separator/Separator.vue";
import AddPassengerForm from "~/components/admin/customers/AddPassengerForm.vue";
import EditDeleteActions from "~/components/admin/passengers/EditDeleteActions.vue";

const store = useCustomerStore();
const { getCustomerByIdAction, editCustomer } = store;

const passengerStore = usePassengerStore();
const { deletePassengerAction, loading } = passengerStore;

const route = useRoute();

const fetchCustomerData = async () => {
  const data = await getCustomerByIdAction(route?.params?.id as string);
  editCustomerData.value = data;
  return data;
};
const isLoading = ref<boolean>(false);
const editCustomerData = ref<any>();
const showAddPassengerForm = ref<boolean>(false);

editCustomerData.value = await fetchCustomerData();

const deletePassenger = async (id: string) => {
  await deletePassengerAction(id).then(() => fetchCustomerData());
};

const toggleAddPassengerForm = () => {
  showAddPassengerForm.value = !showAddPassengerForm.value;
};

const columnHelper = createColumnHelper<any>();

const passengerColumns = [
  columnHelper.accessor("name", {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        () => ["Nome", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("status", {
    header: () => h("div", { class: "text-left" }, "Situação"),
    cell: ({ row }) => {
      const status = row.getValue("status");
      return h(
        "div",
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white ${
            status === "active"
              ? "bg-green-600"
              : status === "inactive"
              ? "bg-red-700"
              : "bg-yellow-500"
          }`,
        },
        status === "active"
          ? "Ativo"
          : status === "inactive"
          ? "Inativo"
          : "Pendente"
      );
    },
  }),
  columnHelper.accessor("position", {
    header: () => h("div", { class: "text-left" }, "Cargo"),
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("position")),
  }),
  columnHelper.accessor("department", {
    header: () => h("div", { class: "text-left" }, "CC/Depto."),
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("department")),
  }),
  columnHelper.accessor("email", {
    header: () => h("div", { class: "text-left" }, "E-mail"),
    cell: ({ row }) => h("div", { class: "lowercase" }, row.getValue("email")),
  }),
  columnHelper.accessor("phone", {
    header: () => h("div", { class: "text-left" }, "Telefone"),
    cell: ({ row }) => h("div", { class: "lowercase" }, row.getValue("phone")),
  }),
  columnHelper.accessor("restrictions", {
    header: () => h("div", { class: "text-left" }, "Restrições"),
    cell: ({ row }) =>
      row.getValue<any>("restrictions").map((item: string) => {
        return h("div", { class: "lowercase" }, item);
      }),
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    header: () => h("div", { class: "text-left" }, "Ações"),
    cell: ({ row }) => {
      const passengerData = row.original;
      return h(
        "div",
        { class: "relative text-left" },
        h(EditDeleteActions, {
          data: passengerData,
          remove: deletePassenger,
          formControl: toggleAddPassengerForm,
        })
      );
    },
  }),
];

const formSchema = toTypedSchema(
  z.object({
    status: z.string(),
    name: z.string().min(2).max(50),
    document: z.string().min(2).max(50),
    fantasyName: z.string().min(2).max(50),
    street: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    zipcode: z.string().min(2).max(50),
    phone: z.string().min(2).max(12),
    website: z.string().min(2).max(50),
    managerName: z.string().min(2).max(20),
    managerPhone: z.string().min(2).max(12),
    managerEmail: z.string().min(2),
  })
);
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    status: editCustomerData?.value.status,
    name: editCustomerData?.value.name,
    document: editCustomerData?.value.document,
    fantasyName: editCustomerData?.value.fantasyName,
    street: editCustomerData?.value.address?.street,
    streetNumber: editCustomerData?.value.address?.streetNumber,
    zipcode: editCustomerData?.value.address?.zipcode,
    phone: editCustomerData?.value.phone,
    website: editCustomerData?.value.website,
    managerName: editCustomerData?.value.managerName,
    managerEmail: editCustomerData?.value.managerEmail,
    managerPhone: editCustomerData?.value.managerPhone,
  },
});

const onSubmit = form.handleSubmit(async (values) => {
  const newCustomerData = {
    id: route?.params?.id,
    ...values,
  };
  isLoading.value = true;
  await editCustomer(newCustomerData).then(() => {
    isLoading.value = false;
    navigateTo("/admin/customers/active");
  });
});
</script>
<template>
  <main class="p-6">
    <header>
      <div class="mb-8 flex items-center">
        <NuxtLink to="/admin/customers/active" class="flex hover:font-bold">
          <ArrowLeft class="mr-2" />
          Voltar
        </NuxtLink>
      </div>
    </header>
    <section class="mb-6">
      <Card class="bg-zinc-200">
        <form @submit.prevent="onSubmit">
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-md"
                >Dados do Cliente
                <br />
                <span class="font-normal text-3xl">{{
                  editCustomerData.name
                }}</span></CardTitle
              >
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
                        { label: 'Ativo', value: 'active' },
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

              <pre>{{ editCustomerData.ccAreas }}</pre>
            </div>
            <div class="mb-4 w-full grid grid-cols-4 gap-8">
              <FormField v-slot="{ componentField }" name="street">
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
              <FormField v-slot="{ componentField }" name="zipcode">
                <FormItem class="col-span-1">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="12345-678"
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
            </div>
            <div class="my-10">
              <h2 class="mb-4 text-lg font-bold">Gerente da Conta</h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="managerName">
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <FormSelect
                        v-bind="componentField"
                        :items="[
                          {
                            label: 'Felipe Vegners',
                            value: 'Felipe Vegners',
                          },
                          {
                            label: 'Humberto Pansica',
                            value: 'Humberto Pansica',
                          },
                          {
                            label: 'Maria dos Santos',
                            value: 'Maria dos Santos',
                          },
                          {
                            label: 'João da Silva',
                            value: 'João da Silva',
                          },
                        ]"
                        :label="'Selecione o gerente'"
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
            <Separator class="my-8 bg-zinc-300" />
            <div class="mb-6 flex">
              <h2 class="mb-6 mr-6 font-bold text-xl">Usuários Cadastrados</h2>
              <Button
                type="button"
                class="flex items-center justify-center"
                @click="toggleAddPassengerForm"
              >
                <Plus class="w-4 h-4" /> Adicionar usuário
              </Button>
            </div>
            <section v-if="showAddPassengerForm">
              <AddPassengerForm
                :customerId="editCustomerData?.id"
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
              v-if="editCustomerData.status !== 'pending'"
              class="mb-6 p-6 flex items-center justify-center rounded-md bg-white"
            >
              <p class="text-zinc-400">Nenhuma pendência encontrada</p>
            </section>
            <section
              class="p-6 flex gap-8 rounded-md border-4 border-red-500 bg-white"
            >
              <h2 class="font-bold text-xl">Acesso ao sistema</h2>
              <div class="flex items-center space-x-3">
                <Label for="customer-enabled" class="text-md">
                  <LockKeyhole />
                </Label>

                <Switch id="customer-enabled" />
                <Label for="customer-enabled" class="text-md">
                  <LockKeyholeOpen />
                </Label>
              </div>
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
                @click="navigateTo('/admin/customers/active')"
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
