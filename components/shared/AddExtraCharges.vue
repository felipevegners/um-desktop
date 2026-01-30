<script setup lang="ts">
import { Paperclip, Plus, Trash } from 'lucide-vue-next';
import { vMaska } from 'maska/vue';

import FormSelect from './FormSelect.vue';

defineOptions({
  name: 'AddExtraCharges',
});

const emit = defineEmits(['update:modelValue']);
const props = defineProps(['modelValue']);
const maskedValue = ref('');
const unmaskedValue = ref('');

defineExpose({ unmaskedValue });

const addRow = () => {
  props.modelValue.push({
    info: '',
    type: '',
    ammount: '',
  });
};

const removeRow = (index: any) => {
  if (props.modelValue.length === 0) return;
  props.modelValue.splice(index, 1);
};
</script>
<template>
  <Button v-if="props.modelValue.length === 0" @click.prevent="addRow">
    <Plus />
    Adicionar Taxa
  </Button>
  <ul class="mb-4 space-y-6">
    <li
      v-for="(extra, index) in props.modelValue"
      :key="extra.type"
      class="md:grid md:grid-cols-5 gap-4 items-end"
    >
      <div class="flex flex-col items-start gap-2">
        <small>Tipo de taxa</small>
        <FormSelect
          :items="[
            { label: 'Pedágio', value: 'toll_fee' },
            { label: 'Estacionamento', value: 'parking_fee' },
            { label: 'Diária de Hotel', value: 'hotel_fee' },
            { label: 'Outros', value: 'others' },
          ]"
          label="Selecione o tipo"
          v-model="extra.type"
        />
      </div>
      <div class="col-span-2 flex flex-col items-start gap-2">
        <small>Descrição</small>
        <Input type="text" v-model="extra.description" />
      </div>
      <div class="flex items-end gap-1">
        <div class="relative flex flex-col items-start gap-2">
          <small>Valor</small>
          <Input
            type="text"
            v-maska:unmaskedValue.unmasked="'9##.99#,##'"
            data-maska-tokens="9:[0-9]:repeated"
            data-maska-reversed
            class="relative pl-9"
            v-model="extra.ammount"
          />
          <span
            class="absolute start-0 top-[36px] flex items-center justify-center px-3 text-sm"
          >
            R$
          </span>
        </div>
        <Button
          type="button"
          class="mb-0.5"
          @click.prevent="() => {}"
          size="icon"
          variant="ghost"
          disabled
        >
          <Paperclip />
        </Button>
      </div>
      <div class="flex items-center gap-4">
        <Button @click.prevent="addRow">
          <Plus />
          Adicionar
        </Button>
        <Button
          variant="ghost"
          @click.prevent="removeRow(index)"
          :disabled="props.modelValue.length === 0"
        >
          <Trash />
        </Button>
      </div>
    </li>
  </ul>
</template>

<style scoped></style>
