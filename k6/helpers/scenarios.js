// Reusable scenario bundles and threshold presets.

export const THRESHOLDS = {
  // Public / cheap reads: aim for sub-300ms at p95
  fast: {
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    http_req_failed: ['rate<0.01'],
  },
  // Authenticated reads / writes: allow up to 600ms at p95
  normal: {
    http_req_duration: ['p(95)<600', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
  },
  // Heavy queries / payment flows: allow up to 2s at p95
  heavy: {
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    http_req_failed: ['rate<0.02'],
  },
};

// Named scenario: ramp from 0 to maxVUs, hold, then ramp down.
export function rampScenario({ maxVUs = 50, rampUpSec = 60, holdSec = 300, rampDownSec = 60 } = {}) {
  return {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: `${rampUpSec}s`, target: maxVUs },
      { duration: `${holdSec}s`, target: maxVUs },
      { duration: `${rampDownSec}s`, target: 0 },
    ],
    gracefulRampDown: '30s',
  };
}

// Named scenario: spike — fast ramp up to peak, hold briefly, drop back.
export function spikeScenario({ peakVUs = 200, rampSec = 30, holdSec = 60 } = {}) {
  return {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: `${rampSec}s`, target: peakVUs },
      { duration: `${holdSec}s`, target: peakVUs },
      { duration: `${rampSec}s`, target: 0 },
    ],
    gracefulRampDown: '15s',
  };
}

// Named scenario: constant rate — useful for soak tests.
export function soakScenario({ vus = 20, durationMin = 30 } = {}) {
  return {
    executor: 'constant-vus',
    vus,
    duration: `${durationMin}m`,
    gracefulStop: '60s',
  };
}
