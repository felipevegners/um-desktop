<script setup lang="ts">
import { onMounted, ref } from "vue";
definePageMeta({
  layout: "admin"
});

useHead({
  title: "Clientes ativos"
});

import { Plus, LoaderCircle } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createColumnHelper } from "@tanstack/vue-table";
import { ArrowUpDown } from "lucide-vue-next";
import { h } from "vue";
import DropdownAction from "@/components/shared/DataTableDropDown.vue";
import DataTable from "~/components/shared/DataTable.vue";
import FormSelect from "~/components/shared/FormSelect.vue";

const customers = ref<any>([]);
const isLoading = ref<boolean>(true);
onMounted(async () => {
  try {
    isLoading.value = true;
    const data = await $fetch("/api/admin/customers");
    customers.value = data;
  } catch (error) {
  } finally {
    isLoading.value = false;
  }
});

export interface Payment {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
}

const tableData = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "felipevegners@gmail.com"
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@gmail.com"
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@gmail.com"
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@gmail.com"
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com"
  }
];

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
        ariaLabel: "Select all"
      }),
    cell: ({ row }) => {
      return h(Checkbox, {
        checked: row.getIsSelected(),
        "onUpdate:checked": (value) => row.toggleSelected(!!value),
        ariaLabel: "Select row"
      });
    },
    enableSorting: false,
    enableHiding: false
  }),
  columnHelper.accessor("name", {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc")
        },
        () => ["Nome", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name"))
  }),
  columnHelper.accessor("document", {
    header: () => h("div", { class: "text-left" }, "CNPJ"),
    cell: ({ row }) =>
      h("div", { class: "lowercase" }, row.getValue("document"))
  }),
  columnHelper.accessor("phone", {
    header: () => h("div", { class: "text-left" }, "Contato"),
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("phone"))
  }),
  columnHelper.accessor("website", {
    header: () => h("div", { class: "text-left" }, "Site"),
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-left font-medium" },
        row.getValue("website")
      );
    }
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
          onExpand: row.toggleExpanded
        })
      );
    }
  })
];

const showAddForm = ref(true);

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
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar novo cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="">
            <FormField name="name" class="mb-4 w-full grid grid-cols-2 gap-8">
              <FormItem>
                <FormLabel>Nome da Empresa</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Insira o nome da empresa" />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="XX.XXX.XXX/0001-XX" />
                </FormControl>
                <!-- <FormDescription class="text-sm text-red-500">
                  This is your public display name.
                </FormDescription> -->
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField name="name" class="mb-4 grid grid-cols-4 gap-8">
              <FormItem class="col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Insira o endereço" />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem class="col-span-1">
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Insira o número" />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Insira o número" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField name="name" class="grid grid-cols-3 gap-8">
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="(XX) XXXXX-XXXX" />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Site</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="www.site.com.br" />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Logo Empresa</FormLabel>
                <FormControl>
                  <Input type="file" placeholder="Insira o logo da empresa" />
                </FormControl>
              </FormItem>
            </FormField>
            <div class="my-10">
              <h2 class="mb-4 text-lg font-bold">Gerente da Conta</h2>
              <Separator class="mb-4" />
              <FormField name="name" class="grid grid-cols-3 gap-8">
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl> </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="(XX) XXXXX-XXXX" />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>E-mail de Contato</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="nome@email.com.br" />
                  </FormControl>
                </FormItem>
              </FormField>
              <FormSelect />
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
    <section
      v-if="isLoading"
      class="p-10 h-full flex items-center justify-center"
    >
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section v-else>
      <DataTable :columns="columns" :data="customers" sortby="name" />
    </section>
  </main>
</template>
