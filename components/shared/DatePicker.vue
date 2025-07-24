<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
import { CalendarIcon } from 'lucide-vue-next';

const df = new DateFormatter('pt-BR', {
  dateStyle: 'short',
});

const travelDate = defineModel<DateValue>();
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        class="w-full justify-start text-left font-normal h-10"
        :class="!travelDate && 'text-muted-foreground'"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{
          travelDate
            ? df.format(travelDate.toDate(getLocalTimeZone()))
            : 'Selecione a Data'
        }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="p-0">
      <Calendar v-model="travelDate" initial-focus />
    </PopoverContent>
  </Popover>
</template>
