import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

async function startDevMocks() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./shared/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

void startDevMocks().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
