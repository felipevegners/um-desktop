import { decode } from '@googlemaps/polyline-codec';
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
  if (!!polyline) {
    const response = decode(polyline, 5);
    return response;
  } else {
    return [];
  }
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
    return 'not a number';
  }

  if (typeof time === 'string') {
    return parseInt(time);
  }

  // Round to nearest second
  time = Math.round(time);

  // If less than an hour (3600 seconds), return MM:SS format
  if (time < 3600) {
    const minutes = Math.floor(time / 60);

    return `00:${minutes.toString().padStart(2, '0')} min`;
  }

  // If an hour or more, return HH:MM format
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} hs`;
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

export const sanitizeRideDate = (rideDate: string) => {
  return rideDate?.split('-').reverse().join('/');
};

export const calculateTimeDifference = (
  startTime: string | number,
  endTime: string | number,
) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const differenceInMs = Math.abs(end.getTime() - start.getTime());

  const seconds = Math.floor(differenceInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  return {
    milliseconds: differenceInMs,
    seconds: seconds,
    minutes: minutes,
    hours: hours,
    days: days,
    formatted: `${hours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds`,
  };
};

export const generatePassword = () => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&?';

  // Combine all allowed characters
  const allChars = lowercase + uppercase + numbers + symbols;

  // Generate 6 random indices using cryptographically secure random values
  const buf = new Uint8Array(8);
  window.crypto.getRandomValues(buf);

  // Use each random byte to select a character from the allowed set
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += allChars[buf[i] % allChars.length];
  }

  return password;
};

export const getFirstAndLastNameString = (fullName: string) => {
  const parts = fullName?.trim().split(/\s+/);
  const firstName = parts && parts[0];
  const lastName = parts?.length > 1 ? parts[parts.length - 1] : '';
  return `${firstName} ${lastName}`;
};
