import { useActiveLayerIds, useLayerList } from '@entities/layer'
import { useSelectedTime } from '@entities/time'
import { useLoadSeries } from '@features/load-series'
import { useInitialSelectedTime, useSelectTime } from '@features/select-time'
import { useChartData } from '../model/useChartData'
import { Chart } from './Chart'

export function ConnectedChart() {
  const { rows, lines, loading, errors } = useChartData()
  const list = useLayerList()
  const activeLayerIds = useActiveLayerIds()
  const selectedTime = useSelectedTime()
  useInitialSelectedTime()
  const retry = useLoadSeries()
  const selectTime = useSelectTime()

  return (
    <Chart
      rows={rows}
      lines={lines}
      selectedTime={selectedTime}
      list={list}
      activeLayerCount={activeLayerIds.length}
      loading={loading}
      errors={errors}
      onSelectTime={selectTime}
      onRetry={retry}
    />
  )
}
