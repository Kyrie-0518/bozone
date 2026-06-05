import MagicalBackground from '@/components/ui/magical-background'
import CardContainer from '@/components/ui/card-container'
import { Logo } from '@/assets/logo'
import { motion } from 'framer-motion'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <MagicalBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[420px] px-4"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col items-center gap-2"
        >
          <Logo className="size-10" />
          <h1 className="text-xl font-bold tracking-tight text-[#1c1917]">
            Bozone
          </h1>
          <span className="text-xs text-[#78716c]">TikTok Shop 专精 · 智能运营</span>
        </motion.div>

        {/* 3D Card */}
        <CardContainer>{children}</CardContainer>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 text-center text-xs text-[#a8a29e]"
        >
          安全加密 · 数据隔离
        </motion.p>
      </motion.div>
    </div>
  )
}
