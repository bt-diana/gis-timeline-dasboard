import { delay, http, HttpResponse } from 'msw'
import type { ApiError } from '../../api'
import { MOCK_LAYERS } from '../data/layers'
import { isFailing } from '../failureSwitch'
import { randomLatency } from '../latency'

const INJECTED_FAILURE: ApiError = {
  error: { code: 'INTERNAL', message: 'The layer service is not responding. Please try again.' },
}

export const layerHandlers = [
  http.get('/api/layers', async () => {
    await delay(randomLatency())
    if (isFailing()) {
      return HttpResponse.json(INJECTED_FAILURE, { status: 500 })
    }
    return HttpResponse.json(MOCK_LAYERS)
  }),
]
