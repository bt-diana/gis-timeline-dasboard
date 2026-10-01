import type { LayerDefinition, RenderingKind } from './types'

const RENDERING_KINDS: readonly string[] = ['points', 'arrows', 'heatmap'] satisfies RenderingKind[]

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isString = (value: unknown): value is string => typeof value === 'string'

export function isLayerDefinition(value: unknown): value is LayerDefinition {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.kind) &&
    RENDERING_KINDS.includes(value.kind) &&
    isString(value.unit) &&
    Array.isArray(value.timePoints) &&
    value.timePoints.every(isString)
  )
}

export function isLayerDefinitionList(value: unknown): value is LayerDefinition[] {
  return Array.isArray(value) && value.every(isLayerDefinition)
}
