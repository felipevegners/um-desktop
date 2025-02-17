<script setup lang="ts">
import * as z from "zod";
import FormSelect from "@/components/shared/FormSelect.vue";
import { LoaderCircle } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { useToast } from "@/components/ui/toast/use-toast";
import { usePassengerStore } from "~/stores/admin/passengers.store";
import { storeToRefs } from "pinia";
const store = usePassengerStore();

const { toast } = useToast();

const { createNewPassengerAction, updatePassengerAction, getPassengersAction } =
  store;
const { loading, passenger, isEditing } = storeToRefs(store);

const emit = defineEmits(["show-form", "fetch-customer"]);
const showPassengerForm = () => {
  emit("show-form");
};

const regularUserFormSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    phone: z.string().min(2).max(50),
    document: z.string().min(2).max(16),
    status: z.string().min(2).max(50)
  })
);

const regularUserForm = useForm({
  validationSchema: regularUserFormSchema
});

const onSubmitUser = regularUserForm.handleSubmit(async (values) => {
  const newUserData = {
    // id: passenger?.value.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    document: values.document,
    status: values.status,
    active: true,
    type: "regular"
  };

  if (isEditing && passenger?.value.id) {
    try {
      await updatePassengerAction(newUserData);
    } catch (error) {
      console.log("Erro na atualização do usuário -> ", error);
    } finally {
      emit("fetch-customer");
      toast({
        title: "Feito!",
        class: "bg-green-600 border-0 text-white text-2xl",
        description: "Usuário atualizado com sucesso!"
      });
      emit("show-form");
    }
  } else {
    try {
      await createNewPassengerAction(newUserData);
    } catch (error) {
      console.log("Erro no envio do usuário -> ", error);
    } finally {
      emit("fetch-customer");
      toast({
        title: "Feito!",
        class: "bg-green-600 border-0 text-white text-2xl",
        description: "Usuário adicionado com sucesso!"
      });
      await getPassengersAction();
      emit("show-form");
    }
  }
});
</script>

<template>
  <form @submit="onSubmitUser">
    <div class="mb-8 p-8 gap-4 bg-zinc-300 rounded-md">
      <div class="grid grid-cols-5 gap-4 items-center">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem class="relative">
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: João Silva"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="email">
          <FormItem class="relative">
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: joao_silva@email.com.br"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="phone">
          <FormItem>
            <FormLabel>Celular</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: 11-9987605432"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="document">
          <FormItem>
            <FormLabel>CPF</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="ex.: 123.345.567-89"
                v-bind="componentField"
              />
            </FormControl>
            <!-- <FormMessage class="absolute" /> -->
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="status">
          <FormItem>
            <FormLabel>Situação</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="[
                  { label: 'Ativo', value: 'active' },
                  { label: 'Inativo', value: 'inactive' }
                ]"
                :label="'Selecione a situação'"
              />
            </FormControl>
          </FormItem>
        </FormField>
      </div>
      <div class="mt-4 py-4 flex gap-4">
        <Button type="submit">
          <LoaderCircle v-if="loading" class="w-10 h-10 animate-spin" />
          Salvar</Button
        >
        <Button variant="ghost" @click.prevent="showPassengerForm"
          >Cancelar</Button
        >
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
