import { delay, http, HttpResponse } from 'msw'
import { mockSnapshot } from '../data/snapshots'
import { randomLatency } from '../latency'

const SNAPSHOT_MOCK_MESSAGES = {
  badTime: 'The requested time is not valid.',
  unknownLayer: 'This layer does not exist.',
  noData: 'No data for this layer at the selected time.',
} as const

const errorResponse = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status })

export const snapshotHandlers = [
  http.get('/api/layers/:layerId/snapshot', async ({ params, request }) => {
    await delay(randomLatency())
    const time = new URL(request.url).searchParams.get('time')
    if (!time || Number.isNaN(Date.parse(time))) {
      return errorResponse(400, 'BAD_REQUEST', SNAPSHOT_MOCK_MESSAGES.badTime)
    }
    const { layerId } = params
    const result = mockSnapshot(typeof layerId === 'string' ? layerId : '', time)
    if (!result.found) return errorResponse(404, 'NOT_FOUND', SNAPSHOT_MOCK_MESSAGES.unknownLayer)
    if (!result.snapshot) return errorResponse(404, 'NO_DATA', SNAPSHOT_MOCK_MESSAGES.noData)
    return HttpResponse.json(result.snapshot)
  }),
]
