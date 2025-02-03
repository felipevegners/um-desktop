<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Plus, LoaderCircle } from "lucide-vue-next";
import { usePassengerStore } from "~/stores/admin/passengers.store";

const store = usePassengerStore();
const { createNewPassengerAction } = store;

// const isLoading = ref<boolean>(loading);

const props = defineProps<{
  customerId: string;
}>();

const passengersformSchema = toTypedSchema(
  z.object({
    passengerName: z.string().min(2).max(50),
    passengerEmail: z.string().min(2).max(50),
    passengerPhone: z.string().min(2).max(50)
    // position: z.string().min(2).max(50),
    // restrictions: z.string().min(2).max(50),
    // history: z.string().min(2).max(50)
  })
);

const passengersForm = useForm({
  validationSchema: passengersformSchema
  //   initialValues: {}
});

const onSubmitPassengers = passengersForm.handleSubmit(async (values) => {
  //   console.log("customer id -> ", props.customerId);

  const newPassengerData = {
    name: values.passengerName,
    email: values.passengerEmail,
    phone: values.passengerPhone,
    position: "Diretor de Ops",
    restrictions: ["week", "weekends"],
    history: [],
    customerId: props.customerId
  };

  try {
    await createNewPassengerAction(newPassengerData).then((res) =>
      console.log("Response -> ", res)
    );
  } catch (error) {
    console.log("Erro no envio do passageiro -> ", error);
  }
});
</script>
<template>
  <div>
    <form @submit="onSubmitPassengers">
      <div
        class="mb-8 p-8 flex items-center justify-between gap-4 bg-zinc-300 rounded-md"
      >
        <div class="grid grid-cols-3 gap-4 items-center">
          <FormField v-slot="{ componentField }" name="passengerName">
            <FormItem class="w-[300px]">
              <!-- <FormLabel>Nome do Passageiro</FormLabel> -->
              <FormControl>
                <Input
                  type="text"
                  placeholder="Nome do passageiro"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="passengerEmail">
            <FormItem>
              <!-- <FormLabel>E-mail</FormLabel> -->
              <FormControl>
                <Input
                  type="text"
                  placeholder="passageiro@exemplo.com.br"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="passengerPhone">
            <FormItem>
              <!-- <FormLabel>Celular</FormLabel> -->
              <FormControl>
                <Input
                  type="text"
                  placeholder="Telefone celular"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        <div class="flex items-center justify-center gap-4">
          <Button type="submit">
            <LoaderCircle v-if="store.loading" class="w-10 h-10 animate-spin" />
            Salvar</Button
          >
          <Button variant="outline">Cancelar</Button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
