import { createFileRoute } from '@tanstack/react-router'
import { AdsReportsPage } from '@/features/ads/reports'

export const Route = createFileRoute('/_authenticated/ads/reports')({
  component: AdsReportsPage,
})
