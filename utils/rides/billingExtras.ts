const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number.parseFloat(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const resolveEstimatedDurationSeconds = (ride: any): number => {
  const candidates = [
    ride?.travel?.estimatedDuration,
    ride?.travel?.estimatedDurationSeconds,
    ride?.billingBreakdown?.planned?.estimatedDurationSeconds,
  ];

  for (const candidate of candidates) {
    const parsed = toNumber(candidate);
    if (parsed > 0) return parsed;
  }

  return 0;
};

const resolveRealizedDurationSeconds = (ride: any): number => {
  const candidates = [
    ride?.travel?.completedData?.finalDuration,
    ride?.billingBreakdown?.realized?.durationSeconds,
    ride?.realizedMetrics?.realizedDurationSeconds,
  ];

  for (const candidate of candidates) {
    const parsed = toNumber(candidate);
    if (parsed > 0) return parsed;
  }

  return 0;
};

const resolveFallbackExtraMinutes = (ride: any): number => {
  const estimatedSeconds = resolveEstimatedDurationSeconds(ride);
  const realizedSeconds = resolveRealizedDurationSeconds(ride);
  if (
    estimatedSeconds <= 0 ||
    realizedSeconds <= 0 ||
    realizedSeconds <= estimatedSeconds
  ) {
    return 0;
  }

  return Math.max(0, (realizedSeconds - estimatedSeconds) / 60);
};

const resolveStoredExtraHours = (ride: any): number =>
  toNumber(ride?.travel?.completedData?.rideExtraHours);

const resolveStoredExtraHourPrice = (ride: any): number =>
  toNumber(ride?.travel?.completedData?.rideExtraHourPrice);

const resolveMinutePrice = (ride: any): number => {
  const candidates = [
    ride?.billingBreakdown?.pricingSnapshot?.minutePrice,
    ride?.product?.minutePrice,
  ];

  for (const candidate of candidates) {
    const parsed = toNumber(candidate);
    if (parsed > 0) return parsed;
  }

  return 0;
};

export const resolveDisplayExtraHours = (ride: any): number => {
  const storedExtraHours = resolveStoredExtraHours(ride);
  if (storedExtraHours > 0) return storedExtraHours;
  return resolveFallbackExtraMinutes(ride) / 60;
};

export const resolveDisplayExtraMinutes = (ride: any): number => {
  const storedExtraHours = resolveStoredExtraHours(ride);
  if (storedExtraHours > 0) return storedExtraHours * 60;
  return resolveFallbackExtraMinutes(ride);
};

export const resolveDisplayExtraHourPrice = (ride: any): number => {
  const storedExtraHourPrice = resolveStoredExtraHourPrice(ride);
  if (storedExtraHourPrice > 0) return storedExtraHourPrice;

  const minutePrice = resolveMinutePrice(ride);
  const fallbackExtraMinutes = resolveFallbackExtraMinutes(ride);
  if (minutePrice <= 0 || fallbackExtraMinutes <= 0) return 0;

  return fallbackExtraMinutes * minutePrice;
};
