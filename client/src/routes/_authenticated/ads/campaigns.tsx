import { createFileRoute } from '@tanstack/react-router'
import { AdsCampaignsPage } from '@/features/ads/campaigns'

export const Route = createFileRoute('/_authenticated/ads/campaigns')({
  component: AdsCampaignsPage,
})
