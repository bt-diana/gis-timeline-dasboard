import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

async function startMockApi() {
  try {
    const { worker } = await import('./shared/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', quiet: !import.meta.env.DEV })
  } catch (error: unknown) {
    console.error('The mock API failed to start; layer requests will fail.', error)
  }
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

function renderApp(container: HTMLElement) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void startMockApi().then(() => {
  renderApp(root)
})
