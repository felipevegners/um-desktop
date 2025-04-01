<script setup lang="ts">
import { LoaderCircle, Trash } from 'lucide-vue-next';

defineOptions({
  name: 'DeleteAction',
});

defineProps<{
  remove?: any;
  data?: any;
  loading?: boolean;
}>();

const showConfirmationModal = ref(false);

const toggleConfirmationModal = () => {
  showConfirmationModal.value = !showConfirmationModal.value;
};
</script>
<template>
  <Trash
    class="w-4 h-4 hover:text-red-500 cursor-pointer"
    @click.prevent="toggleConfirmationModal"
  />
  <AlertDialog :open="showConfirmationModal">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Deseja realmente excluir?</AlertDialogTitle>
        <AlertDialogDescription>
          Essa ação é irreversível e excluirá permanentemente da base de dados.
          <br />
          <br />
          <strong>ID a ser deletado:</strong> {{ data.id }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="toggleConfirmationModal"
          >Cancelar</AlertDialogCancel
        >
        <AlertDialogAction
          class="bg-red-500 hover:bg-red-600"
          @click="
            () => {
              remove(data.id);
              toggleConfirmationModal();
            }
          "
        >
          <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
