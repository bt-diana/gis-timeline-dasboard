import './App.css'
import { Chart } from '@features/chart/Chart'
import { Header } from '@features/header/Header'
import { LayerPanel } from '@features/layer/LayerPanel'
import { Map } from '@features/map/Map'
import { ACTIVE_LAYER_FIXTURE_IDS, LAYER_FIXTURES } from './layerFixtures'

export function App() {
  return (
    <div className="shell">
      <Header />
      <LayerPanel
        layers={LAYER_FIXTURES}
        activeLayerIds={ACTIVE_LAYER_FIXTURE_IDS}
        onToggleLayer={() => undefined}
      />
      <div className="workspace">
        <Map />
        <Chart />
      </div>
    </div>
  )
}
