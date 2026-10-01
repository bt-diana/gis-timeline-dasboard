import { useLoadSnapshots } from '@features/load-snapshots'
import { useMapData } from '../model/useMapData'
import { Map } from './Map'

export function ConnectedMap() {
  const { layers, loadingTime } = useMapData()
  useLoadSnapshots()

  return <Map layers={layers} loadingTime={loadingTime} />
}
