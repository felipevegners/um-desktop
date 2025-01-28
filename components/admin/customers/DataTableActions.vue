<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, LoaderCircle } from "lucide-vue-next";
import { useCustomerStore } from "~/stores/admin/customers.store";
import { storeToRefs } from "pinia";

const customerStore = useCustomerStore();
const { toggleDeleteModal } = customerStore;
const { loading, viewDeleteModal } = storeToRefs(customerStore);

const props = defineProps<{
  customerData: {
    id: string;
    name: string;
    managerEmail: string;
    managerPhone: string;
  };
  delete: Function;
}>();

const deleteModalState = ref<boolean>(false);
const isLoading = ref(loading);

const handleDeleteModal = () => {
  deleteModalState.value = !deleteModalState.value;
};

function copy(data: string) {
  navigator.clipboard.writeText(data);
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-8 p-0">
        <span class="sr-only">Abrir menu</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="px-4">
      <DropdownMenuLabel class="mb-2 border-b"
        >Gerenciar Cliente</DropdownMenuLabel
      >
      <DropdownMenuItem @click="copy(props.customerData.name)">
        Copiar E-mail do Gerente
      </DropdownMenuItem>
      <DropdownMenuItem @click="copy(props.customerData.managerPhone)">
        Copiar Telefone do Gerente
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <NuxtLink
          :to="{
            name: 'admin-customers-edit-id',
            params: { id: props.customerData.id },
          }"
        >
          Editar dados
        </NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="text-red-500"
        @click="
          toggleDeleteModal({
            id: props.customerData.id,
            name: props.customerData.name,
          })
        "
      >
        Excluir
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
