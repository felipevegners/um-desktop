<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
      <DropdownMenuItem> Editar dados </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="text-red-500"
        @click="
          toggleDeleteModal({
            id: props.customerData.id,
            name: props.customerData.name
          })
        "
      >
        Excluir
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- Delete Modal -->
  <!-- <Dialog :open="deleteModalState" :close="true">
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="mb-4"
          >Excluir cadastro de {{ props.customerData.name }}?</DialogTitle
        >
        {{ props.customerData.id }}
        <DialogDescription>
          Esta ação não poderá ser desfeita e o cliente sairá da base de dados
          permanentemente.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary" @click="handleDeleteModal">
            Cancelar
          </Button>
        </DialogClose>
        <Button
          variant="destructive"
          @click="props.delete(props.customerData.id)"
        >
          <LoaderCircle v-if="isLoading" class="w-10 h-10 animate-spin" />
          Confirmar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog> -->
</template>
