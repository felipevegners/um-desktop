import { createColumnHelper } from "@tanstack/vue-table";

const columnHelper = createColumnHelper<any>();

const columns = [
  columnHelper.accessor("status", {
    header: () => h("div", { class: "text-left" }, "Cadastro"),
    cell: ({ row }) => {
      const status = row.getValue("status");
      return h(
        "div",
        {
          class: `px-2 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${
            status === "active" ? "bg-green-600" : "bg-yellow-600"
          }`
        },
        status === "active" ? "Aprovado" : "Pendente"
      );
    }
  }),
  columnHelper.accessor("fantasyName", {
    enablePinning: true,
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc")
        },
        () => ["Nome Fantasia", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("fantasyName"))
  }),
  columnHelper.accessor("document", {
    header: () => h("div", { class: "text-left" }, "CNPJ"),
    cell: ({ row }) =>
      h("div", { class: "lowercase" }, row.getValue("document"))
  }),
  columnHelper.accessor("managerName", {
    header: () => h("div", { class: "text-left" }, "Gerente"),
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("managerName"))
  }),
  columnHelper.accessor("managerEmail", {
    header: () => h("div", { class: "text-left" }, "E-mail Gerente"),
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-left font-medium" },
        row.getValue("managerEmail")
      );
    }
  }),
  columnHelper.accessor("enabled", {
    header: () => h("div", { class: "text-left" }, "Acesso"),
    cell: ({ row }) => {
      const enabled = row.getValue("enabled");
      return h(
        "div",
        {
          class: `px-1 flex items-center justify-center h-6 rounded-lg text-white text-xs max-w-[80px] ${
            enabled === true ? "bg-blue-600" : "bg-zinc-600"
          }`
        },
        enabled === true ? "Liberado" : "Negado"
      );
    }
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    header: () => h("div", { class: "text-left" }, "Ações"),
    cell: ({ row }) => {
      const customerData = row.original;
      return h(
        "div",
        { class: "relative text-left" },
        h(DataTableActions, {
          customerData,
          isLoadingSend,
          deleteModalOpen,
          handleModal: handleDeleteModal,
          delete: handleDeleteCustomer,
          onExpand: row.toggleExpanded
        })
      );
    }
  })
];
