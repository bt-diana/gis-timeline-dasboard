const MAP_LABEL_ID = 'map-area-label'

export function Map() {
  return (
    <main className="shell-map placeholder" aria-labelledby={MAP_LABEL_ID}>
      <h2 id={MAP_LABEL_ID} className="placeholder-label">
        Map
      </h2>
    </main>
  )
}
