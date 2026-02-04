<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { Check, ChevronsUpDown, Search } from 'lucide-vue-next';
import { ref } from 'vue';
import { cn } from '~/lib/utils';

const props = defineProps<{
  items: any;
}>();

defineOptions({
  name: 'SelectSearchUser',
});

const user = ref<(typeof props.items.value)[0]>();

const emit = defineEmits(['on-select']);

const selected = () => {
  emit('on-select', user);
};
</script>

<template>
  <Combobox v-model="user" by="label" @update:model-value="selected">
    <ComboboxAnchor as-child>
      <ComboboxTrigger as-child>
        <Button variant="outline" class="justify-between w-full md:w-[400px]">
          {{ user?.label ?? 'Selecione' }}

          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList class="md:w-[400px] md:max-h-[300px]">
      <div class="relative w-full items-center">
        <ComboboxInput
          class="pl-9 focus-visible:ring-0 border-0 border-b rounded-none h-10 w-full"
          placeholder="Buscar usuário..."
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
          <Search class="size-4 text-muted-foreground" />
        </span>
      </div>

      <ComboboxEmpty> Nenhum usuário encontrado. </ComboboxEmpty>

      <ComboboxGroup>
        <ComboboxItem v-for="user in props.items" :key="user.value" :value="user">
          {{ user.label }}

          <ComboboxItemIndicator>
            <Check :class="cn('ml-auto h-4 w-4')" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
