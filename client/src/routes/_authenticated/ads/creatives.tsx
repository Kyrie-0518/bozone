import { createFileRoute } from '@tanstack/react-router'
import { AdsCreativesPage } from '@/features/ads/creatives'

export const Route = createFileRoute('/_authenticated/ads/creatives')({
  component: AdsCreativesPage,
})
