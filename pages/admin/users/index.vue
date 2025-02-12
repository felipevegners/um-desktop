<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

useHead({
  title: "Clientes ativos",
});

import { ref } from "vue";
import { Plus, LoaderCircle } from "lucide-vue-next";
import AddPassengerForm from "~/components/admin/customers/AddPassengerForm.vue";
import DataTable from "~/components/shared/DataTable.vue";
import { createColumnHelper } from "@tanstack/vue-table";
import EditDeleteActions from "~/components/admin/passengers/EditDeleteActions.vue";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-vue-next";
import { usePassengerStore } from "~/stores/admin/passengers.store";
import { storeToRefs } from "pinia";

const passengerStore = usePassengerStore();
const { deletePassengerAction, loading, getPassengersAction } = passengerStore;

const { passengers } = storeToRefs(passengerStore);

const showAddForm = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isRegularUser = ref<boolean>(true);

onMounted(async () => {
  isLoading.value = true;
  await getPassengersAction().then(() => {
    isLoading.value = false;
  });
});

// usersList.value = fetchUsersData();

const toggleShowAddForm = () => {
  showAddForm.value = !showAddForm.value;
};

const onSubmit = () => {};

const columnHelper = createColumnHelper<any>();

const deletePassenger = async (id: string) => {
  await deletePassengerAction(id);
};

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
          formControl: () => {},
        })
      );
    },
  }),
];
</script>

<template>
  <main class="p-6">
    <section class="mb-6 flex items-center gap-6">
      <h1 class="font-bold text-black text-3xl">Base de Usuários</h1>
      <div v-if="!showAddForm">
        <Button @click="toggleShowAddForm">
          <Plus class="w-4 h-4" /> Criar novo usuário
        </Button>
      </div>
    </section>
    <section v-if="showAddForm" class="mb-4 py-4">
      <Card class="bg-zinc-200">
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="mb-8 p-8 flex items-center space-x-4 bg-white rounded-md">
            <h4 class="font-bold">Tipo de usuário:</h4>
            <Label for="customer-enabled" class="text-md font-normal">
              Regular
            </Label>
            <Switch
              v-model="isRegularUser"
              @update:checked="isRegularUser = !isRegularUser"
            />
            <Label for="customer-enabled" class="text-md font-normal">
              Corporativo
            </Label>
          </div>
          <form @submit.prevent="onSubmit">
            <AddPassengerForm
              :regularMode="isRegularUser"
              @show-form="toggleShowAddForm"
            />
          </form>
        </CardContent>
      </Card>
    </section>
    <section v-if="isLoading" class="p-10 flex items-center justify-center">
      <LoaderCircle class="w-10 h-10 animate-spin" />
    </section>
    <section class="mb-6 px-4 rounded-md bg-white">
      <DataTable :columns="passengerColumns" :data="passengers" sortby="name" />
    </section>
  </main>
</template>
