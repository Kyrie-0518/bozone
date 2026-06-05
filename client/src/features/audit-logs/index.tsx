import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, ScrollText } from 'lucide-react'

interface LogEntry {
  id: number
  userId: string | null
  username: string
  action: string
  method: string
  path: string
  detail: string
  ip: string
  createdAt: string
}

const methodColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  GET: 'default',
  POST: 'secondary',
  PUT: 'outline',
  PATCH: 'outline',
  DELETE: 'destructive',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.auditLogs.list(200)
      if (res.success) setLogs(res.data)
    } catch { /* handle silently */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-6">
      <PageHeader
        title="操作日志"
        subtitle="系统自动记录所有 API 操作，保留 30 天"
        icon={ScrollText}
      />

      <Card className="rounded-[10px] shadow-sm border-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <p className="text-sm text-slate-500">
              共 <span className="font-semibold text-slate-700">{logs.length}</span> 条记录
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="rounded-[8px] gap-1.5 text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">用户</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">请求</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">详情</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IP</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">时间</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-3.5">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      <ScrollText className="mx-auto h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">暂无操作记录</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-sm text-slate-700 font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm text-slate-600">
                          {log.username || '匿名'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={methodColors[log.method] || 'outline'} className="rounded-[6px] text-[10px] px-1.5 py-0 font-mono">
                            {log.method}
                          </Badge>
                          <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                            {log.path}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs text-slate-500">{log.detail}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs text-slate-400 font-mono">{log.ip}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
