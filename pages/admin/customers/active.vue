<script setup lang="ts">
import { onMounted, ref } from "vue";
definePageMeta({
  layout: "admin"
});

useHead({
  title: "Clientes ativos"
});

import { Plus } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createColumnHelper } from "@tanstack/vue-table";
import { ArrowUpDown } from "lucide-vue-next";
import { h } from "vue";
import DropdownAction from "@/components/shared/DataTableDropDown.vue";
import DataTable from "~/components/shared/DataTable.vue";

const customers = ref<any>([]);
onMounted(async () => {
  const data = await $fetch("/api/admin/customers");
  customers.value = data;
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
    header: "Nome",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name"))
  }),
  columnHelper.accessor("document", {
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc")
        },
        () => ["CNPJ", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) =>
      h("div", { class: "lowercase" }, row.getValue("document"))
  }),
  columnHelper.accessor("phone", {
    header: () => h("div", { class: "text-right" }, "Contato"),
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("phone"))
  }),
  columnHelper.accessor("website", {
    header: () => h("div", { class: "text-right" }, "Site"),
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right font-medium" },
        row.getValue("website")
      );
    }
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    header: () => h("div", { class: "text-right" }, "Ações"),
    cell: ({ row }) => {
      const payment = row.original;

      return h(
        "div",
        { class: "relative text-right" },
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
      <h1 class="font-bold text-black text-2xl">Clientes ativos</h1>
      <div>
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
            <Label>Nome da Empresa</Label>
            <Input type="text" />
          </form>
        </CardContent>
      </Card>
    </section>
    <section>
      <DataTable :columns="columns" :data="customers" sortby="name" />
    </section>
  </main>
</template>
