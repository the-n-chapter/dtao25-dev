import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Given an array of datapoints [{ value, createdAt }], run a simple linear regression
 * to get slope (m) and intercept (b) for value vs. time (seconds).
 * Returns { slope, intercept, datapoints }.
 */
export function getSessionRegression(datapoints: { value: number, createdAt: string }[]) {
  if (!datapoints || datapoints.length < 2) {
    return { slope: 0, intercept: datapoints?.[0]?.value ?? 0, datapoints };
  }
  const SECOND = 1000;
  const session = [...datapoints];
  session.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const t0 = new Date(session[0].createdAt).getTime();
  const xs = session.map(d => (new Date(d.createdAt).getTime() - t0) / SECOND);
  const ys = session.map(d => d.value);
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX  += xs[i];
    sumY  += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }
  const denominator = n * sumXX - sumX * sumX;
  const m = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const b = n === 0 ? 0 : (sumY - m * sumX) / n;
  return { slope: m, intercept: b, datapoints: session };
}

/**
 * Estimate remaining time (ms) until `targetValue` is reached, using regression.
 * Returns Infinity if not enough data.
 */
export function estimateTimeRemainingLR(datapoints: { value: number, createdAt: string }[], targetValue = 0) {
  const { slope, intercept, datapoints: session } = getSessionRegression(datapoints);
  if (session.length < 2) return Infinity;
  const SECOND = 1000;
  const nowSeconds = (Date.now() - new Date(session[0].createdAt).getTime()) / 1000;
  const currentVal = slope * nowSeconds + intercept;
  const dtSeconds = (targetValue - currentVal) / slope;
  return dtSeconds * SECOND;
}

