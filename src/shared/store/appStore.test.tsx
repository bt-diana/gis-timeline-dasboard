import { useEffect, type ReactNode } from 'react'
import { act, render, renderHook, screen } from '@testing-library/react'
import { AppStoreProvider, initialAppStoreState, useAppDispatch, useAppStoreSelector, type AppStoreUpdate } from './appStore'

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider state={initialAppStoreState}>{children}</AppStoreProvider>
}

describe('appStore', () => {
  it('useAppDispatch returns the same function on every render', () => {
    const { result, rerender } = renderHook(() => useAppDispatch(), { wrapper })
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })

  it('a selector sees a write made in a child mount effect before it subscribed', () => {
    function Writer() {
      const dispatch = useAppDispatch()
      useEffect(() => {
        dispatch(({ layer }) => ({ layer: { ...layer, list: { status: 'loading' } } }))
      }, [dispatch])
      return null
    }
    function Reader() {
      const list = useAppStoreSelector(({ layer }) => layer.list)
      return (
        <>
          <output>{list.status}</output>
          <Writer />
        </>
      )
    }

    render(<Reader />, { wrapper })

    expect(screen.getByRole('status')).toHaveTextContent('loading')
  })

  it('a selector keeps its reference when another part of the store changes', () => {
    const { result } = renderHook(
      () => ({
        layers: useAppStoreSelector(({ layer }) => layer.layers),
        activeLayerIds: useAppStoreSelector(({ layer }) => layer.activeLayerIds),
        dispatch: useAppDispatch(),
      }),
      { wrapper },
    )
    const layersBefore = result.current.layers

    act(() => {
      result.current.dispatch(({ layer }) => ({ layer: { ...layer, activeLayerIds: ['wind'] } }))
    })

    expect(result.current.activeLayerIds).toEqual(['wind'])
    expect(result.current.layers).toBe(layersBefore)
  })

  it('stops updating a component after it unmounts, while the others keep updating', () => {
    const renders = { stays: 0, leaves: 0 }
    function Counter({ name }: { name: keyof typeof renders }) {
      useAppStoreSelector(({ layer }) => layer.activeLayerIds)
      renders[name] += 1
      return null
    }
    let dispatch: ((update: AppStoreUpdate) => void) | undefined
    function Dispatcher() {
      dispatch = useAppDispatch()
      return null
    }
    const tree = (withLeaver: boolean) => (
      <AppStoreProvider state={initialAppStoreState}>
        <Dispatcher />
        <Counter name="stays" />
        {withLeaver && <Counter name="leaves" />}
      </AppStoreProvider>
    )
    const { rerender } = render(tree(true))
    rerender(tree(false))
    const leaverRenders = renders.leaves
    const stayerRenders = renders.stays

    act(() => {
      dispatch?.(({ layer }) => ({ layer: { ...layer, activeLayerIds: ['wind'] } }))
    })

    expect(renders.leaves).toBe(leaverRenders)
    expect(renders.stays).toBe(stayerRenders + 1)
  })
})
