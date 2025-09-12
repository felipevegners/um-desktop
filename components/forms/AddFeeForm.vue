<script setup lang="ts">
import { FormField } from '#components';
import { useFeeStore } from '#imports';
import { useToast } from '@/components/ui/toast/use-toast';
import { feeStatus, feeTypes } from '@/config/feeTypes';
import { toTypedSchema } from '@vee-validate/zod';
import { LoaderCircle, Save } from 'lucide-vue-next';
import { useForm } from 'vee-validate';
import * as z from 'zod';

import FormSelect from '../shared/FormSelect.vue';

const { toast } = useToast();

const store = useFeeStore();
const { createFeeAction, getFeesAction } = store;
const { isLoading } = storeToRefs(store);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Insira o nome').max(100),
    type: z.string().min(2).max(50),
    value: z.string().min(1).max(3),
    active: z.boolean(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit(async (values) => {
  const payload = {
    ...values,
    enabled: true,
  };

  try {
    await createFeeAction(payload);
    toast({
      title: 'Tudo pronto!',
      class: 'bg-green-600 border-0 text-white text-2xl',
      description: `Comissão criada com sucesso!`,
    });
  } catch (error) {
    toast({
      title: 'Opss!',
      variant: 'destructive',
      description: `Ocorreu um erro ao criar a Comissão. Tente novamente.`,
    });
  } finally {
    emit('cancel');
  }
});

const emit = defineEmits(['cancel', 'finish']);

const onCancel = () => {
  form.values = {};
  emit('cancel');
};
</script>
<template>
  <Card class="p-6 bg-zinc-200">
    <form @submit="onSubmit" @keydown.enter.prevent="true" id="form">
      <div class="grid grid-cols-4 gap-6 items-center">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem class="col-span-1">
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <div class="flex gap-2">
                <Input type="text" v-bind="componentField" />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="value">
          <FormItem class="col-span-1">
            <FormLabel>Valor</FormLabel>
            <FormControl>
              <div class="flex gap-2">
                <Input type="text" v-bind="componentField" maxlength="2" />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="type">
          <FormItem class="col-span-1">
            <FormLabel>Tipo</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="feeTypes"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="active">
          <FormItem class="col-span-1">
            <FormLabel>Status</FormLabel>
            <FormControl>
              <FormSelect
                v-bind="componentField"
                :items="feeStatus"
                :label="'Selecione'"
              />
            </FormControl>
          </FormItem>
        </FormField>
        <div class="h-full flex items-center gap-2">
          <Button type="submit" form="form">
            <LoaderCircle v-if="isLoading" class="animate-spin" />
            <Save v-else />
            Salvar
          </Button>
          <Button type="button" variant="ghost" @click="onCancel"> Cancelar </Button>
        </div>
      </div>
    </form>
  </Card>
</template>

<style scoped></style>
