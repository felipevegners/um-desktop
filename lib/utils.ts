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

export const convertSecondsToTime = (seconds: any) => {
  let time = seconds;
  // Ensure we have a valid number
  if (typeof time !== 'number' || time < 0) {
    return '00:00';
  }

  if (typeof time === 'string') {
    return parseInt(time);
  }

  // Round to nearest second
  time = Math.round(time);

  // If less than an hour (3600 seconds), return MM:SS format
  if (time < 3600) {
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // If an hour or more, return HH:MM format
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const convertMetersToDistance = (meters: any, threshold = 1000) => {
  // Ensure we have a valid number
  if (typeof meters !== 'number' || meters < 0) {
    return '0 m';
  }

  // Round to avoid floating point precision issues
  meters = Math.round(meters * 100) / 100;

  // If distance is less than threshold (default 1000m), return in meters
  if (meters < threshold) {
    return `${Math.round(meters)} m`;
  }

  // Convert to kilometers and format appropriately
  const kilometers = meters / 1000;

  // If it's a whole number of kilometers, don't show decimals
  if (kilometers % 1 === 0) {
    return `${Math.round(kilometers)} km`;
  }

  // Show 1 decimal place for kilometers
  return `${kilometers.toFixed(1)} km`;
};

/**
 * Alternative version that returns an object with value and unit
 * @param {number} meters - The distance in meters to convert
 * @param {number} threshold - The threshold in meters to switch to kilometers (default: 1000)
 * @returns {object} - Object with value and unit properties
 */
export const convertMetersToDistanceObject = (meters: any, threshold = 1000) => {
  // Ensure we have a valid number
  if (typeof meters !== 'number' || meters < 0) {
    return { value: 0, unit: 'm', formatted: '0 m' };
  }

  meters = Math.round(meters * 100) / 100;

  if (meters < threshold) {
    const value = Math.round(meters);
    return {
      value: value,
      unit: 'm',
      formatted: `${value} m`,
    };
  }

  const kilometers = meters / 1000;
  const value =
    kilometers % 1 === 0 ? Math.round(kilometers) : parseFloat(kilometers.toFixed(1));

  return {
    value: value,
    unit: 'km',
    formatted: `${value} km`,
  };
};
