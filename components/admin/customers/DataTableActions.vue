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
import { MoreHorizontal } from "lucide-vue-next";

defineProps<{
  customerData: {
    id: string;
    managerEmail: string;
    managerPhone: string;
  };
}>();

function copy(data: string) {
  navigator.clipboard.writeText(data);
}

async function deleteCustomer(id: string) {
  try {
    await $fetch("/api/admin/customers", {
      method: "DELETE",
      body: { id },
    });
  } catch (error) {
    console.log("Error -> ", error);
  } finally {
    alert("Usuário excluido com sucesso");
  }
}
</script>

<template>
  <Dialog>
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
        <DropdownMenuItem @click="copy(customerData.managerEmail)">
          Copiar E-mail do Gerente
        </DropdownMenuItem>
        <DropdownMenuItem @click="copy(customerData.managerPhone)">
          Copiar Telefone do Gerente
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DialogTrigger as-child>
          <DropdownMenuItem> Editar dados </DropdownMenuItem>
          <!-- <Button variant="outline"> Edit Profile </Button> -->
        </DialogTrigger>
        <DropdownMenuItem
          class="text-red-500"
          @click="deleteCustomer(customerData.id)"
          >Excluir</DropdownMenuItem
        >
      </DropdownMenuContent>
    </DropdownMenu>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. Are you sure you want to permanently
          delete this file from our servers?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="submit">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
