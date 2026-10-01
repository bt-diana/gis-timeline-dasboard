export function toggleLayerIds(activeLayerIds: readonly string[], layerId: string): readonly string[] {
  if (activeLayerIds.includes(layerId)) {
    return activeLayerIds.filter((id) => id !== layerId)
  }

  return [...activeLayerIds, layerId]
}
