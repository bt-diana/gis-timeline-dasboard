export type ApiErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'NO_DATA' | 'INTERNAL'

export interface ApiError {
  error: { code: ApiErrorCode; message: string }
}

const API_ERROR_CODES: readonly string[] = ['BAD_REQUEST', 'NOT_FOUND', 'NO_DATA', 'INTERNAL']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export function isApiError(value: unknown): value is ApiError {
  if (!isRecord(value) || !isRecord(value.error)) return false
  const { code, message } = value.error
  return typeof code === 'string' && API_ERROR_CODES.includes(code) && typeof message === 'string'
}

export class ApiRequestError extends Error {
  override name = 'ApiRequestError'
}

export function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError'
}
