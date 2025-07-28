<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date';
import { CalendarIcon } from 'lucide-vue-next';
import { toDate } from 'reka-ui/date';
import { computed, ref } from 'vue';

const props = defineProps<{
  form?: any;
}>();

const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const placeholder = ref();

const { setFieldValue, values } = props.form;

const value = computed({
  get: () => (values.departDate ? parseDate(values.departDate) : undefined),
  set: (val) => val,
});
</script>

<template>
  <FormField v-slot="{ componentField }" name="departDate">
    <FormItem>
      <FormLabel>Data do Atendimento</FormLabel>
      <Popover>
        <PopoverTrigger as-child>
          <FormControl>
            <Button
              variant="outline"
              :class="
                cn(
                  'w-[240px] ps-3 text-start font-normal',
                  !value && 'text-muted-foreground',
                )
              "
            >
              <span>{{ value ? df.format(toDate(value)) : 'Selecione' }}</span>
              <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
            </Button>
            <input hidden />
          </FormControl>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar
            v-bind="componentField"
            v-model:placeholder="placeholder"
            :model-value="value"
            calendar-label="Data do Atendimento"
            initial-focus
            :min-value="today(getLocalTimeZone())"
            @update:model-value="
              (v) => {
                if (v) {
                  setFieldValue('departDate', v.toString());
                } else {
                  setFieldValue('departDate', undefined);
                }
              }
            "
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
