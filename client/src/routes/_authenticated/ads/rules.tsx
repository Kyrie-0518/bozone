import { createFileRoute } from '@tanstack/react-router'
import { AdsRulesPage } from '@/features/ads/rules'

export const Route = createFileRoute('/_authenticated/ads/rules')({
  component: AdsRulesPage,
})
