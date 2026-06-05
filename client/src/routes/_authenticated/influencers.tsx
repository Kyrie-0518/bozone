import { createFileRoute } from '@tanstack/react-router'
import { InfluencersPage } from '@/features/influencers'

export const Route = createFileRoute('/_authenticated/influencers')({
  component: InfluencersPage,
})
