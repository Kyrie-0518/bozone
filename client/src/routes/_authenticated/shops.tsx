import { createFileRoute } from '@tanstack/react-router'
import { ShopsPage } from '@/features/shops'

export const Route = createFileRoute('/_authenticated/shops')({
  component: ShopsPage,
})
