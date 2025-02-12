import { createColumnHelper } from "@tanstack/vue-table";
import EditDeleteActions from "~/components/admin/passengers/EditDeleteActions.vue";

import { Button } from "@/components/ui/button";

import { ArrowUpDown } from "lucide-vue-next";

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
