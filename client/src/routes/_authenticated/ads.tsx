import { createFileRoute } from '@tanstack/react-router'
import { AdsPage } from '@/features/ads'

export const Route = createFileRoute('/_authenticated/ads')({
  component: AdsPage,
})
