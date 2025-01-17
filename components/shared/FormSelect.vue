<script lang="ts" setup>
// const props = defineProps<{
//   items?: any;
// }>();
</script>

<template>
  <Select>
    <FormControl>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o nome" />
      </SelectTrigger>
    </FormControl>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Usuários Ativos</SelectLabel>
        <SelectItem value="Felipe Vegners"> Felipe Vegners </SelectItem>
        <SelectItem value="João Silva"> João Silva </SelectItem>
        <SelectItem value="Manoel Batista"> Manoel Batista </SelectItem>
        <SelectItem value="Joana Silva"> Joana Silva </SelectItem>
        <SelectItem value="Ana Paula Guerreiro">
          Ana Paula Guerreiro
        </SelectItem>
        <SelectItem value="Gabriela Fabri"> Gabriela Fabri </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
