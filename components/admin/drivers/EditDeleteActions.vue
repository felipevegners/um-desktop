<script setup lang="ts">
  const props = defineProps<{
    remove?: any;
    data?: any;
    formControl: Function;
  }>();
  import { Edit, Trash, LoaderCircle } from "lucide-vue-next";
  import { userDriverStore } from "@/stores/admin/drivers.store";
  import { storeToRefs } from "pinia";

  const driverStore = userDriverStore();
  const { getDriverByIdAction } = driverStore;
  const { loadingSend } = storeToRefs(driverStore);

  const showConfirmationModal = ref(false);

  const toggleConfirmationModal = () => {
    showConfirmationModal.value = !showConfirmationModal.value;
  };

  const handleEditDriver = async (driverId: string) => {
    try {
      await getDriverByIdAction(driverId);
    } catch (error) {
      console.log(error);
    } finally {
      props.formControl();
      navigateTo({
        name: "admin-drivers-edit-id",
        params: { id: driverId }
      });
    }
  };
</script>
<template>
  <div class="flex gap-2">
    <Button variant="ghost" class="p-1" @click.prevent="handleEditDriver(data.id)">
      <Edit class="w-4 h-4 text-zinc-700" />
    </Button>
    <Button variant="ghost" class="p-1" @click.prevent="toggleConfirmationModal">
      <Trash class="w-4 h-4 text-red-500" />
    </Button>
  </div>

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
        <AlertDialogCancel @click="toggleConfirmationModal">Cancelar</AlertDialogCancel>
        <AlertDialogAction class="bg-red-500 hover:bg-red-600" @click="
          () => {
            remove(data.id);
            toggleConfirmationModal();
          }
        ">
          <LoaderCircle v-if="loadingSend" class="w-10 h-10 animate-spin" />
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped></style>
