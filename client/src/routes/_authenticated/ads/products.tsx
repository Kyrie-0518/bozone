import { createFileRoute } from '@tanstack/react-router'
import { AdsProductsPage } from '@/features/ads/products'

export const Route = createFileRoute('/_authenticated/ads/products')({
  component: AdsProductsPage,
})
