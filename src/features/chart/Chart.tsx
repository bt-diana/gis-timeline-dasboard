const CHART_LABEL_ID = 'chart-area-label'

export function Chart() {
  return (
    <section className="shell-chart placeholder" aria-labelledby={CHART_LABEL_ID}>
      <h2 id={CHART_LABEL_ID} className="placeholder-label">
        Chart
      </h2>
    </section>
  )
}
