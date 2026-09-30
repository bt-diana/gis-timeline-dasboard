import './App.css'
import { Header } from '@features/header/Header'
import { Layer } from '@features/layer/Layer'
import { Map } from '@features/map/Map'
import { Chart } from '@features/chart/Chart'

export function App() {
  return (
    <div className="shell">
      <Header />
      <Layer />
      <div className="workspace">
        <Map />
        <Chart />
      </div>
    </div>
  )
}
