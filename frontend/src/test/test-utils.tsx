import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { BrowserRouter } from 'react-router'

interface AllTheProvidersProps {
  children: ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return <BrowserRouter>{children}</BrowserRouter>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
