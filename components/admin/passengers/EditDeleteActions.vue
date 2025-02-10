<script setup lang="ts">
const props = defineProps<{
  remove: any;
  data: any;
  formControl: Function;
}>();
import { Edit, Trash, LoaderCircle } from "lucide-vue-next";
import { usePassengerStore } from "@/stores/admin/passengers.store";
import { storeToRefs } from "pinia";

const passengerStore = usePassengerStore();
const { toggleDeleteModal, getPassengerById } = passengerStore;
const { loading, viewDeleteModal } = storeToRefs(passengerStore);

const handleEditPassenger = async (passId: string) => {
  try {
    await getPassengerById(passId);
  } catch (error) {
    console.log(error);
  } finally {
    props.formControl();
  }
};
</script>
<template>
  <div class="flex gap-2">
    <Button
      variant="ghost"
      class="p-1"
      @click.prevent="handleEditPassenger(data.id)"
    >
      <Edit class="w-4 h-4 text-blue-700" />
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
