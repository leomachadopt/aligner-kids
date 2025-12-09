/**
 * Página de Status do localStorage
 * Mostra estado atual e permite diagnosticar problemas
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react'
import storageMonitor from '@/utils/storageMonitor'

const StorageStatus = () => {
  const [status, setStatus] = useState<any>(null)
  const [showRawData, setShowRawData] = useState(false)
  const [rawData, setRawData] = useState<any>({})

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = () => {
    const getCount = (key: string): number => {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data).length : 0
    }

    const getSize = (key: string): number => {
      const data = localStorage.getItem(key)
      return data ? new Blob([data]).size : 0
    }

    const getSampleData = (key: string, limit: number = 3) => {
      const data = localStorage.getItem(key)
      if (!data) return []
      const parsed = JSON.parse(data)
      return parsed.slice(0, limit)
    }

    setStatus({
      clinics: {
        count: getCount('clinics'),
        size: getSize('clinics'),
        sample: getSampleData('clinics'),
      },
      users: {
        count: getCount('auth_users'),
        size: getSize('auth_users'),
        sample: getSampleData('auth_users').map((u: any) => ({
          email: u.email,
          role: u.role,
          clinicId: u.clinicId,
        })),
      },
      aligners: {
        count: getCount('aligners'),
        size: getSize('aligners'),
      },
      treatments: {
        count: getCount('treatments'),
        size: getSize('treatments'),
      },
      stories: {
        count: getCount('stories'),
        size: getSize('stories'),
      },
      missions: {
        count: getCount('patient_missions'),
        size: getSize('patient_missions'),
      },
      missionTemplates: {
        count: getCount('mission_templates'),
        size: getSize('mission_templates'),
      },
      session: {
        exists: !!localStorage.getItem('auth_session'),
        size: getSize('auth_session'),
      },
      totalSize: Object.keys(localStorage).reduce((sum, key) => {
        return sum + (localStorage.getItem(key)?.length || 0)
      }, 0),
      totalKeys: localStorage.length,
    })

    // Raw data
    const raw: any = {}
    Object.keys(localStorage).forEach((key) => {
      try {
        raw[key] = JSON.parse(localStorage.getItem(key) || '{}')
      } catch {
        raw[key] = localStorage.getItem(key)
      }
    })
    setRawData(raw)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleExportSnapshot = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      data: rawData,
      stats: status,
    }
    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `storage-snapshot-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!status) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Carregando...</p>
      </div>
    )
  }

  const hasData = status.clinics.count > 0 || status.users.count > 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Status do localStorage
            </h1>
            <p className="text-muted-foreground mt-2">
              Diagnóstico e monitoramento do armazenamento local
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleExportSnapshot}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Snapshot
            </Button>
          </div>
        </div>
      </div>

      {/* Alerta de status */}
      <Alert variant={hasData ? 'default' : 'destructive'} className="mb-6">
        {hasData ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertTitle>
          {hasData ? 'Dados encontrados' : 'Nenhum dado encontrado'}
        </AlertTitle>
        <AlertDescription>
          {hasData
            ? 'O localStorage contém dados da aplicação.'
            : 'O localStorage está vazio. Isso pode indicar que os dados foram perdidos ou ainda não foram criados.'}
        </AlertDescription>
      </Alert>

      {/* Resumo geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Chaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.totalKeys}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(status.totalSize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clínicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.clinics.count}</div>
            <p className="text-xs text-muted-foreground">{formatBytes(status.clinics.size)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.users.count}</div>
            <p className="text-xs text-muted-foreground">{formatBytes(status.users.size)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes por tipo de dado */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Clínicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Clínicas
              <Badge variant={status.clinics.count > 0 ? 'default' : 'secondary'}>
                {status.clinics.count}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.clinics.sample.length > 0 ? (
              <div className="space-y-2">
                {status.clinics.sample.map((clinic: any) => (
                  <div key={clinic.id} className="text-sm border-l-2 pl-2 border-primary/50">
                    <div className="font-semibold">{clinic.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ID: {clinic.id} • {clinic.country}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada</p>
            )}
          </CardContent>
        </Card>

        {/* Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Usuários
              <Badge variant={status.users.count > 0 ? 'default' : 'secondary'}>
                {status.users.count}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status.users.sample.length > 0 ? (
              <div className="space-y-2">
                {status.users.sample.map((user: any, idx: number) => (
                  <div key={idx} className="text-sm border-l-2 pl-2 border-primary/50">
                    <div className="font-semibold">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Role: {user.role}
                      {user.clinicId && ` • Clinic: ${user.clinicId}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Outros dados */}
        <Card>
          <CardHeader>
            <CardTitle>Tratamentos & Alinhadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Tratamentos:</span>
              <Badge variant="outline">{status.treatments.count}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Alinhadores:</span>
              <Badge variant="outline">{status.aligners.count}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo & Gamificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Histórias:</span>
              <Badge variant="outline">{status.stories.count}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Missões Ativas:</span>
              <Badge variant="outline">{status.missions.count}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Templates de Missão:</span>
              <Badge variant="outline">{status.missionTemplates.count}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados brutos (opcional) */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dados Brutos (JSON)</CardTitle>
              <CardDescription>Visualização completa do localStorage</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showRawData && (
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* Info do monitor */}
      <Alert className="mt-6">
        <Database className="h-4 w-4" />
        <AlertTitle>Storage Monitor</AlertTitle>
        <AlertDescription>
          O sistema está monitorando o localStorage a cada 5 segundos.
          Se houver perda de dados, você verá alertas no console (F12).
          <div className="mt-2">
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => {
                console.log('📊 Status do Storage Monitor:')
                storageMonitor.showStatus()
              }}
            >
              Ver status no console
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default StorageStatus
