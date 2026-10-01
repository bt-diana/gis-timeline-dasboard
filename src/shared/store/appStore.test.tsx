import { useEffect, type ReactNode } from 'react'
import { render, renderHook, screen } from '@testing-library/react'
import { AppStoreProvider, initialAppStoreState, useAppDispatch, useAppStoreSelector } from './appStore'

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

  it('a selector keeps its value when another part of the store changes', () => {
    const { result } = renderHook(
      () => ({ layers: useAppStoreSelector(({ layer }) => layer.layers), dispatch: useAppDispatch() }),
      { wrapper },
    )
    const layersBefore = result.current.layers

    result.current.dispatch(({ layer }) => ({ layer: { ...layer, activeLayerIds: ['wind'] } }))

    expect(result.current.layers).toBe(layersBefore)
  })
})
