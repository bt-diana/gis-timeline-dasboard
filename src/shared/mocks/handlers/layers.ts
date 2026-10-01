import { delay, http, HttpResponse } from 'msw'
import { MOCK_LAYERS } from '../data/layers'
import { randomLatency } from '../latency'

export const layerHandlers = [
  http.get('/api/layers', async () => {
    await delay(randomLatency())
    return HttpResponse.json(MOCK_LAYERS)
  }),
]
