import './App.css'
import { Chart } from '@widgets/chart'
import { Header } from '@widgets/header'
import { ConnectedLayerPanel } from '@widgets/layer-panel'
import { Map } from '@widgets/map'
import { AppStoreProvider, initialAppStoreState } from '@shared/store/appStore'

export function App() {
  return (
    <AppStoreProvider state={initialAppStoreState}>
      <div className="shell">
        <Header />
        <ConnectedLayerPanel />
        <div className="workspace">
          <Map />
          <Chart />
        </div>
      </div>
    </AppStoreProvider>
  )
}
