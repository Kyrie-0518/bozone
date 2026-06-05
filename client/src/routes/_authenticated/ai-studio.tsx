import { createFileRoute } from '@tanstack/react-router'
import { AiStudioPage } from '@/features/ai-studio'

export const Route = createFileRoute('/_authenticated/ai-studio')({
  component: AiStudioPage,
})
