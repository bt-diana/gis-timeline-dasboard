type Listener = () => void

const STORAGE_KEY = 'qa:fail-api-requests'

function readStored(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeStored(value: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    return
  }
}

let failing = readStored()
const listeners = new Set<Listener>()

export function isFailing(): boolean {
  return failing
}

export function setFailing(next: boolean): void {
  failing = next
  writeStored(next)
  listeners.forEach((listener) => {
    listener()
  })
}

export function subscribeToFailing(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
