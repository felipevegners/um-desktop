import { decode, encode } from '@googlemaps/polyline-codec';
import type { Updater } from '@tanstack/vue-table';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Ref } from 'vue';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value =
    typeof updaterOrValue === 'function' ? updaterOrValue(ref.value) : updaterOrValue;
}

export const getDate = () => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const date = today.getDate();
  return `${date}/${month}/${year}`;
};

export const dateFormat = (date: any) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    // hour: '2-digit',
    // minute: '2-digit',
    // second: '2-digit',
  });
};

export const currencyFormat = (value: string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
};
// To decode Google Maps Polyline into a Paths
export const polyLineCodec = (polyline: string) => {
  return decode(polyline, 5);
};

export const sanitizePhone = (phone: string) => {
  const sanitized = phone
    .split(' ')
    .join('')
    .replace('(', '')
    .replace(')', '')
    .replace('-', '');
  return sanitized;
};
