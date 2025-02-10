<script setup lang="ts">
import { ref, h } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Plus, LoaderCircle } from "lucide-vue-next";
import { usePassengerStore } from "~/stores/admin/passengers.store";
import FormSelect from "@/components/shared/FormSelect.vue";
import CheckBoxGroup from "@/components/shared/CheckBoxGroup.vue";

import { useToast } from "@/components/ui/toast/use-toast";
import { storeToRefs } from "pinia";

const { toast } = useToast();

const store = usePassengerStore();
const { createNewPassengerAction, updatePassengerAction } = store;
const { loading, passenger, isEditing } = storeToRefs(store);

const props = defineProps<{
  customerId: string;
}>();

// Passar para uma colletcion no banco
// const restrictions = [
//   {
//     id: "week",
//     label: "Semana",
//   },
//   {
//     id: "weekend",
//     label: "Final de Semana",
//   },
//   {
//     id: "holiday",
//     label: "Feriados",
//   },
//   {
//     id: "daylight",
//     label: "Diurno",
//   },
//   {
//     id: "night",
//     label: "Noturno",
//   },
//   {
//     id: "vacations",
//     label: "Férias",
//   },
// ] as const;

const emit = defineEmits(["show-form", "fetch-customer"]);
const showPassengerForm = () => {
  emit("show-form");
};

const passengersformSchema = toTypedSchema(
  z.object({
    name: z.string().min(2).max(50),
    email: z.string().min(2).max(50),
    phone: z.string().min(2).max(50),
    department: z.string().min(2).max(50),
    position: z.string().min(2).max(50),
    status: z.string().min(2).max(50),
    restrictions: z
      .array(z.string())
      .refine((value) => value.some((item) => item), {
        message: "Selecione ao menos uma restrição!",
      }),
  })
);

const passengersForm = useForm({
  validationSchema: passengersformSchema,
  initialValues: passenger ? (passenger as any) : { restrictions: ["week"] },
});

const onSubmitPassengers = passengersForm.handleSubmit(async (values) => {
  const newPassengerData = {
    id: passenger?.value.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    department: values.department,
    position: values.position,
    status: values.status,
    restrictions: values.restrictions,
    customerId: props.customerId,
    active: true,
    history: [],
  };

  if (isEditing && passenger?.value.id) {
    try {
      await updatePassengerAction(newPassengerData);
    } catch (error) {
      console.log("Erro na atualização do usuário -> ", error);
    } finally {
      emit("fetch-customer");
      toast({
        title: "Feito!",
        class: "bg-green-600 border-0 text-white text-2xl",
        description: "Usuário atualizado com sucesso!",
      });
      emit("show-form");
    }
  } else {
    try {
      await createNewPassengerAction(newPassengerData);
    } catch (error) {
      console.log("Erro no envio do usuário -> ", error);
    } finally {
      emit("fetch-customer");
      toast({
        title: "Feito!",
        class: "bg-green-600 border-0 text-white text-2xl",
        description: "Usuário adicionado com sucesso!",
      });
      emit("show-form");
    }
  }
});
</script>
<template>
  <div>
    <form @submit="onSubmitPassengers">
      <div class="mb-8 p-8 gap-4 bg-zinc-300 rounded-md">
        <div class="grid grid-cols-5 gap-4 items-center">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem class="relative">
              <FormLabel>Nome do Usuário</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Nome do usuário"
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
                  placeholder="usuario@exemplo.com.br"
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
                  placeholder="Telefone celular"
                  v-bind="componentField"
                />
              </FormControl>
              <!-- <FormMessage class="absolute" /> -->
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="department">
            <FormItem>
              <FormLabel>CC / Depto.</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Insira o CC / Depto"
                  v-bind="componentField"
                />
              </FormControl>
              <!-- <FormMessage class="absolute" /> -->
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="position">
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <FormSelect
                  v-bind="componentField"
                  :items="[
                    { label: 'Presidente', value: 'presidente' },
                    { label: 'Diretor', value: 'diretor' },
                    { label: 'Gerente', value: 'gerente' },
                    { label: 'Coordenador', value: 'coordenador' },
                    { label: 'Visitante', value: 'visitante' },
                    { label: 'Outro', value: 'outros' },
                  ]"
                  :label="'Selecione um cargo'"
                />
              </FormControl>
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
                    { label: 'Inativo', value: 'inactive' },
                    { label: 'Férias', value: 'vacation' },
                    { label: 'Desligado', value: 'disabled' },
                  ]"
                  :label="'Selecione a situação'"
                />
              </FormControl>
            </FormItem>
          </FormField>
          <FormField
            v-slot="{ componentField }"
            name="restrictionssssss"
            class="barretos"
          >
            <CheckBoxGroup v-bind="componentField" />
          </FormField>
        </div>
        <div class="mt-4 py-4 flex gap-4">
          <Button type="submit">
            <LoaderCircle v-if="store.loading" class="w-10 h-10 animate-spin" />
            Salvar</Button
          >
          <Button variant="ghost" @click.prevent="showPassengerForm"
            >Cancelar</Button
          >
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
