import { delay, http, HttpResponse } from 'msw'
import { MOCK_SERIES } from '../data/series'
import { randomLatency } from '../latency'

const SERIES_MOCK_MESSAGES = {
  unknownLayer: 'This layer does not exist.',
} as const

export const seriesHandlers = [
  http.get('/api/layers/:layerId/series', async ({ params }) => {
    await delay(randomLatency())
    const { layerId } = params
    const series = typeof layerId === 'string' ? MOCK_SERIES[layerId] : undefined
    if (!series) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: SERIES_MOCK_MESSAGES.unknownLayer } },
        { status: 404 },
      )
    }
    return HttpResponse.json(series)
  }),
]
