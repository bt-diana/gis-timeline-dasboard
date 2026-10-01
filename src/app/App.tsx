import './App.css'
import { lazy, Suspense } from 'react'
import { Chart } from '@widgets/chart'
import { Header } from '@widgets/header'
import { ConnectedLayerPanel } from '@widgets/layer-panel'
import { Map } from '@widgets/map'
import { AppStoreProvider, initialAppStoreState } from '@shared/store/appStore'

const QaControl =
  import.meta.env.DEV && import.meta.env.MODE !== 'test'
    ? lazy(() => import('@shared/mocks/QaControl').then((module) => ({ default: module.QaControl })))
    : null

export function App() {
  return (
    <AppStoreProvider state={initialAppStoreState}>
      <div className="shell">
        <Header />
        <div className="shell-layer">
          <ConnectedLayerPanel />
        </div>
        <div className="workspace">
          <Map />
          <Chart />
        </div>
      </div>
      {QaControl && (
        <Suspense fallback={null}>
          <QaControl />
        </Suspense>
      )}
    </AppStoreProvider>
  )
}
