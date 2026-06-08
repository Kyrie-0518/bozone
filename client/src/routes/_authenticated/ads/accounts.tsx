import { createFileRoute } from '@tanstack/react-router'
import { AdsAccountsPage } from '@/features/ads/accounts'

export const Route = createFileRoute('/_authenticated/ads/accounts')({
  component: AdsAccountsPage,
})
