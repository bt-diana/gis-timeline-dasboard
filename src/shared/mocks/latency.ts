const MIN_LATENCY_MS = 300
const MAX_LATENCY_MS = 1500

export function randomLatency(): number {
  return MIN_LATENCY_MS + Math.round(Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS))
}
