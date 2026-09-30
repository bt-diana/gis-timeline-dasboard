import './App.css'
import { Chart } from '@features/chart/Chart'
import { Header } from '@features/header/Header'
import { LayerPanel } from '@features/layer/LayerPanel'
import { Map } from '@features/map/Map'

export function App() {
  return (
    <div className="shell">
      <Header />
      <LayerPanel />
      <div className="workspace">
        <Map />
        <Chart />
      </div>
    </div>
  )
}
