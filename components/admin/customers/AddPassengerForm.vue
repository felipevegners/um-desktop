<script setup lang="ts">
import { ref, h } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Plus, LoaderCircle } from "lucide-vue-next";
import { usePassengerStore } from "~/stores/admin/passengers.store";
import FormSelect from "@/components/shared/FormSelect.vue";
import CheckBoxGroup from "@/components/shared/CheckBoxGroup.vue";

import { toast } from "@/components/ui/toast";

const store = usePassengerStore();
const { createNewPassengerAction } = store;

// const isLoading = ref<boolean>(loading);

const props = defineProps<{
  customerId: string;
}>();

const restrictions = [
  {
    id: "week",
    label: "Semana",
  },
  {
    id: "weekend",
    label: "Final de Semana",
  },
  {
    id: "holiday",
    label: "Feriados",
  },
  {
    id: "daylight",
    label: "Diurno",
  },
  {
    id: "night",
    label: "Noturno",
  },
  {
    id: "vacations",
    label: "Férias",
  },
] as const;

const emit = defineEmits(["show-form", "fetch-customer"]);
const showPassengerForm = () => {
  emit("show-form");
};

const passengersformSchema = toTypedSchema(
  z.object({
    passengerName: z.string().min(2).max(50),
    passengerEmail: z.string().min(2).max(50),
    passengerPhone: z.string().min(2).max(50),
    position: z.string().min(2).max(50),
    department: z.string().min(2).max(50),
    restrictions: z
      .array(z.string())
      .refine((value) => value.some((item) => item), {
        message: "You have to select at least one item.",
      }),
    status: z.string().min(2).max(50),
  })
);

const passengersForm = useForm({
  validationSchema: passengersformSchema,
  initialValues: {
    restrictions: ["week", "weekend"],
  },
});

const onSubmitPassengers = passengersForm.handleSubmit(async (values) => {
  console.log("values -> ", values);
  toast({
    title: "You submitted the following values:",
    description: h(
      "pre",
      { class: "mt-2 w-[340px] rounded-md bg-slate-950 p-4" },
      h("code", { class: "text-white" }, JSON.stringify(values, null, 2))
    ),
  });
  const newPassengerData = {
    name: values.passengerName,
    email: values.passengerEmail,
    phone: values.passengerPhone,
    position: values.position,
    restrictions: values.restrictions,
    customerId: props.customerId,
    history: [],
    active: true,
    status: values.status,
  };

  try {
    await createNewPassengerAction(newPassengerData).then(() => {
      toast({
        title: "Passageiro adicionado com sucesso!",
      });
    });
  } catch (error) {
    console.log("Erro no envio do passageiro -> ", error);
  } finally {
    emit("fetch-customer");
    emit("show-form");
  }
});
</script>
<template>
  <div>
    <form @submit="onSubmitPassengers">
      <div
        class="mb-8 p-8 flex items-center justify-between gap-4 bg-zinc-300 rounded-md"
      >
        <div class="grid grid-cols-4 gap-4 items-center">
          <FormField v-slot="{ componentField }" name="passengerName">
            <FormItem class="relative">
              <FormLabel>Nome do Passageiro</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Nome do passageiro"
                  v-bind="componentField"
                />
              </FormControl>
              <!-- <FormMessage class="absolute" /> -->
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="passengerEmail">
            <FormItem class="relative">
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="passageiro@exemplo.com.br"
                  v-bind="componentField"
                />
              </FormControl>
              <!-- <FormMessage class="absolute" /> -->
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="passengerPhone">
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
              <FormLabel>Centro de Custo / Departamento</FormLabel>
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
                    { label: 'Presidente', value: 'president' },
                    { label: 'Diretor', value: 'director' },
                    { label: 'Gerente', value: 'manager' },
                    { label: 'Coordenador', value: 'coordinator' },
                    { label: 'Visitante', value: 'visitor' },
                    { label: 'Outro', value: 'others' },
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
          <FormField v-slot="{ componentField }" name="restrictions">
            <CheckBoxGroup v-bind="componentField" />
          </FormField>
          <!-- <FormField
            v-for="item in restrictions"
            v-slot="{ value, handleChange }"
            :key="item.id"
            type="checkbox"
            :value="item.id"
            :unchecked-value="false"
            name="restrictions"
          >
            <FormItem class="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  :checked="value.includes(item.id)"
                  @update:checked="handleChange"
                />
              </FormControl>
              <FormLabel class="font-normal">
                {{ item.label }}
              </FormLabel>
            </FormItem>
          </FormField> -->
        </div>
        <div class="flex items-center justify-center gap-4">
          <Button type="submit">
            <LoaderCircle v-if="store.loading" class="w-10 h-10 animate-spin" />
            Salvar</Button
          >
          <Button variant="outline" @click.prevent="showPassengerForm"
            >Cancelar</Button
          >
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
