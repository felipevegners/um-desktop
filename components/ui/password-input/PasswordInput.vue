<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-vue-next';

interface Props {
  modelValue: string;
  type?: 'password' | 'text' | 'email';
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  maxlength?: number;
  error?: string;
  showToggle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'password',
  maxlength: 8,
  showToggle: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showPassword = ref(false);

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const inputType = computed(() => {
  if (props.type !== 'password') return props.type;
  return showPassword.value ? 'text' : 'password';
});
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="text-sm font-medium text-foreground mb-2 block">
      {{ label }}
    </label>
    <div class="relative">
      <Input
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        class="bg-zinc-800 pr-10"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="props.type === 'password' && showToggle"
        type="button"
        @click.prevent="togglePasswordVisibility"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
        :disabled="disabled"
      >
        <EyeOff v-if="showPassword" class="h-5 w-5" />
        <Eye v-else class="h-5 w-5" />
      </button>
    </div>
    <p v-if="error" class="text-xs text-red-500 mt-1">
      {{ error }}
    </p>
  </div>
</template>
