import { ApiRequestError, isAbortError, isApiError } from './apiError'
import { API_MESSAGES } from './config'

export interface RequestOptions<T> {
  signal: AbortSignal
  validate: (body: unknown) => body is T
}

function unexpected(cause: unknown): never {
  if (isAbortError(cause)) throw cause
  throw new ApiRequestError(API_MESSAGES.unexpected, { cause })
}

export async function request<T>(path: string, { signal, validate }: RequestOptions<T>): Promise<T> {
  const response = await fetch(path, { signal }).catch(unexpected)
  const body: unknown = await response.json().catch(unexpected)

  if (!response.ok) {
    throw new ApiRequestError(isApiError(body) ? body.error.message : API_MESSAGES.unexpected)
  }
  if (!validate(body)) {
    throw new ApiRequestError(API_MESSAGES.unexpected)
  }
  return body
}
