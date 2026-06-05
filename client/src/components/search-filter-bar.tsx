// ── Search/Filter Bar Wrapper ──
// Unified layout for search + filter controls
// Usage: <SearchFilterBar>
//   <Input placeholder="搜索..." />
//   <SelectDropdown ... />
// </SearchFilterBar>
import type { ReactNode } from 'react'

interface SearchFilterBarProps {
  children: ReactNode
  className?: string
}

export function SearchFilterBar({ children, className = '' }: SearchFilterBarProps) {
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 p-3 ${className}`}>
      {children}
    </div>
  )
}
