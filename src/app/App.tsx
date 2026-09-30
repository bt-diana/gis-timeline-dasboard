import './App.css'
import { Chart } from '@features/chart/Chart'
import { Header } from '@features/header/Header'
import { LayerPanel } from '@features/layer/LayerPanel'
import { Map } from '@features/map/Map'
import { AppStoreProvider, initialAppStoreState } from '@shared/store/appStore'

export function App() {
  return (
    <AppStoreProvider state={initialAppStoreState}>
      <div className="shell">
        <Header />
        <LayerPanel />
        <div className="workspace">
          <Map />
          <Chart />
        </div>
      </div>
    </AppStoreProvider>
  )
}
