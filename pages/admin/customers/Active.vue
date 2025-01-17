<script setup lang="ts">
import { onMounted, ref } from "vue";
definePageMeta({
  layout: "admin",
});

useHead({
  title: "Clientes ativos",
});

import { Plus, LoaderCircle, Phone } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createColumnHelper } from "@tanstack/vue-table";
import { ArrowUpDown } from "lucide-vue-next";
import { h } from "vue";
import DropdownAction from "@/components/shared/DataTableDropDown.vue";
import DataTable from "~/components/shared/DataTable.vue";
import FormSelect from "~/components/shared/FormSelect.vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(50),
    document: z.string().min(2).max(50),
    street: z.string().min(2).max(50),
    streetNumber: z.string().min(2).max(50),
    zipcode: z.string().min(2).max(50),
    phone: z.string().min(2).max(12),
    website: z.string().min(2).max(50),
    managerName: z.string().min(2).max(20),
    managerPhone: z.string().min(2).max(12),
    logo: z.string().min(2).max(200),
  })
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit((values) => {
  console.log("Form submitted!", values);
});

const customers = ref<any>([]);
const isLoading = ref<boolean>(false);
const showAddForm = ref(false);

async function getCustomers() {
  try {
    isLoading.value = true;
    return await $fetch("/api/admin/customers");
  } catch (error) {
    console.log("Error -> ", error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  customers.value = await getCustomers();
});

export interface Payment {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
}

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) =>
      h(Checkbox, {
        checked:
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate"),
        "onUpdate:checked": (value) => table.toggleAllPageRowsSelected(!!value),
        ariaLabel: "Select all",
      }),
    cell: ({ row }) => {
      return h(Checkbox, {
        checked: row.getIsSelected(),
        "onUpdate:checked": (value) => row.toggleSelected(!!value),
        ariaLabel: "Select row",
      });
    },
    enableSorting: false,
    enableHiding: false,
  }),
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
  columnHelper.accessor("document", {
    header: () => h("div", { class: "text-left" }, "CNPJ"),
    cell: ({ row }) =>
      h("div", { class: "lowercase" }, row.getValue("document")),
  }),
  columnHelper.accessor("phone", {
    header: () => h("div", { class: "text-left" }, "Contato"),
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("phone")),
  }),
  columnHelper.accessor("website", {
    header: () => h("div", { class: "text-left" }, "Site"),
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-left font-medium" },
        row.getValue("website")
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    header: () => h("div", { class: "text-left" }, "Ações"),
    cell: ({ row }) => {
      const payment = row.original;

      return h(
        "div",
        { class: "relative text-left" },
        h(DropdownAction, {
          payment,
          onExpand: row.toggleExpanded,
        })
      );
    },
  }),
];

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
};
</script>

<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Clientes ativos</h1>
      <div v-if="!showAddForm">
        <Button @click="toggleShowAddForm">
          <Plus class="w-4 h-4" /> Cadastrar cliente
        </Button>
      </div>
    </section>
    <section v-if="showAddForm" class="mb-4 py-4 transition-all">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Cadastrar novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="onSubmit">
            <div class="mb-4 w-full grid grid-cols-2 gap-8">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>Nome da empresa</FormLabel>
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
            <div class="my-10">
              <h2 class="mb-4 text-lg font-bold">Gerente da Conta</h2>
              <Separator class="mb-4" />
              <div class="grid grid-cols-3 gap-8">
                <FormField v-slot="{ componentField }" name="managerName">
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <FormSelect v-bind="componentField" />
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

            <Button type="submit"> Cadastrar </Button>
            <Button
              variant="ghost"
              class="ml-4"
              @click.prevent="toggleShowAddForm"
            >
              Cancelar
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable :columns="columns" :data="customers" sortby="name" />
    </section>
  </main>
</template>
