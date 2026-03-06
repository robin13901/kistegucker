import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  initialRoute?: string
}

function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { initialRoute = '/', ...renderOptions } = options

  const user = userEvent.setup()

  return {
    user,
    ...render(ui, { wrapper: AllProviders, ...renderOptions }),
  }
}

export * from '@testing-library/react'
export { customRender as render, userEvent }

// Test data factories
export const createMockPlay = (overrides = {}) => ({
  id: 'play-1',
  slug: 'test-play',
  title: 'Test Play',
  description: 'A test play description',
  poster_image: 'https://example.com/poster.jpg',
  performances: [],
  cast: [],
  ...overrides,
})

export const createMockPerformance = (overrides = {}) => ({
  id: 'perf-1',
  start_datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  doors_datetime: null,
  venue: 'Test Venue',
  capacity: 100,
  online_quota: 50,
  reserved_online_tickets: 10,
  gallery: [],
  is_past: false,
  ...overrides,
})

export const createMockMember = (overrides = {}) => ({
  id: 'member-1',
  name: 'Test Member',
  description: 'A test member description',
  image_url: 'https://example.com/member.jpg',
  club_roles: ['Actor'],
  participations: [],
  ...overrides,
})

export const createMockReservation = (overrides = {}) => ({
  id: 'res-1',
  name: 'Test User',
  email: 'test@example.com',
  tickets: 2,
  performance_id: 'perf-1',
  created_at: new Date().toISOString(),
  ...overrides,
})

// Wait utilities
export const waitForLoadingToFinish = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}
