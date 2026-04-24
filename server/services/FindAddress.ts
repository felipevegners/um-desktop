import { VIACEP } from '@/config/paths';

export const findAddressByZipcode = async (zipcode: string) => {
  const path = VIACEP.replace('[[CEP]]', zipcode);

  try {
    const address = await $fetch(path);
    return address;
  } catch (error) {
    console.debug('Erro ao buscar endereço server --> ', error);
    return error;
  }
};
