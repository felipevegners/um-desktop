<script setup lang="ts">
defineProps<{
  remove: any;
  data: any;
}>();
import { Edit, Trash, LoaderCircle } from "lucide-vue-next";
import { ref } from "vue";
import { usePassengerStore } from "@/stores/admin/passengers.store";

const passengerStore = usePassengerStore();

const viewDeleteModal = ref<boolean>(false);

const toggleDeleteModal = () => {
  viewDeleteModal.value = !viewDeleteModal.value;
};
</script>
<template>
  <div class="flex gap-2">
    <Button variant="ghost" class="p-1" @click="">
      <Edit class="w-4 h-4 text-zinc-500" />
    </Button>
    <Button variant="ghost" class="p-1" @click.prevent="toggleDeleteModal">
      <Trash class="w-4 h-4 text-red-500" />
    </Button>
  </div>

  <AlertDialog :open="viewDeleteModal">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deseja realmente excluir?</AlertDialogTitle>
        <AlertDialogDescription>
          Essa ação é irreversível e excluirá permanentemente da base de dados.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="toggleDeleteModal"
          >Cancelar</AlertDialogCancel
        >
        <AlertDialogAction
          class="bg-red-500 hover:bg-red-600"
          @click="remove(data.id)"
        >
          <LoaderCircle
            v-if="passengerStore.loading"
            class="w-10 h-10 animate-spin"
          />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
