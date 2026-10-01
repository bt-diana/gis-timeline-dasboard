import './App.css'
import { ConnectedChart } from '@widgets/chart'
import { Header } from '@widgets/header'
import { ConnectedLayerPanel } from '@widgets/layer-panel'
import { ConnectedMap } from '@widgets/map'
import { AppStoreProvider, initialAppStoreState } from '@shared/store/appStore'

export function App() {
  return (
    <AppStoreProvider state={initialAppStoreState}>
      <div className="shell">
        <Header />
        <div className="shell-layer">
          <ConnectedLayerPanel />
        </div>
        <div className="workspace">
          <ConnectedMap />
          <ConnectedChart />
        </div>
      </div>
    </AppStoreProvider>
  )
}
