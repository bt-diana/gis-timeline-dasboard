import './QaControl.css'
import { useSyncExternalStore } from 'react'
import { QA_CONTROL_CONFIG } from './config'
import { isFailing, setFailing, subscribeToFailing } from './failureSwitch'

export function QaControl() {
  const failing = useSyncExternalStore(subscribeToFailing, isFailing)

  return (
    <aside className="qa-control" aria-label={QA_CONTROL_CONFIG.label}>
      <label className="qa-control__option">
        <input
          type="checkbox"
          checked={failing}
          onChange={(event) => {
            setFailing(event.target.checked)
          }}
        />
        {QA_CONTROL_CONFIG.failRequests}
      </label>
    </aside>
  )
}
