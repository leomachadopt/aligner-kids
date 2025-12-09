/**
 * Página de Gerenciamento de Dados (Super Admin)
 * Exportar, importar e gerenciar dados do sistema
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Download,
  Upload,
  Trash2,
  Database,
  AlertTriangle,
  CheckCircle,
  FileJson,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import DataExportService from '@/services/dataExportService'

const AdminDataManagement = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(DataExportService.getStats())
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ============================================
  // HANDLERS
  // ============================================

  const handleExport = () => {
    try {
      DataExportService.downloadAsFile()
      setMessage({ type: 'success', text: 'Backup exportado com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro ao exportar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.json')) {
        setMessage({ type: 'error', text: 'Arquivo deve ser .json' })
        return
      }
      setSelectedFile(file)
      setShowImportDialog(true)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    try {
      await DataExportService.importFromFile(selectedFile, {
        merge: importMode === 'merge',
      })

      setStats(DataExportService.getStats())
      setMessage({ type: 'success', text: 'Dados importados com sucesso!' })
      setShowImportDialog(false)
      setSelectedFile(null)

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro ao importar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    setIsProcessing(true)
    try {
      DataExportService.clearAll()
      setStats(DataExportService.getStats())
      setMessage({ type: 'success', text: 'Todos os dados foram limpos' })
      setShowClearDialog(false)

      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro ao limpar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefreshStats = () => {
    setStats(DataExportService.getStats())
    setMessage({ type: 'success', text: 'Estatísticas atualizadas' })
    setTimeout(() => setMessage(null), 2000)
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Gerenciamento de Dados</h1>
        <p className="text-muted-foreground mt-2">
          Exportar, importar e gerenciar dados do sistema
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className="mb-6" variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{message.type === 'success' ? 'Sucesso' : 'Erro'}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estatísticas do Sistema
            </CardTitle>
            <CardDescription>Dados armazenados no localStorage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Clínicas</span>
                <span className="text-2xl font-bold">{stats.clinics}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Pacientes</span>
                <span className="text-2xl font-bold">{stats.patients}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Alinhadores</span>
                <span className="text-2xl font-bold">{stats.aligners}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Templates de Missão</span>
                <span className="text-2xl font-bold">{stats.missionTemplates}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Missões de Pacientes</span>
                <span className="text-2xl font-bold">{stats.patientMissions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Histórias</span>
                <span className="text-2xl font-bold">{stats.stories}</span>
              </div>
            </div>
            <Button onClick={handleRefreshStats} variant="outline" className="w-full mt-4">
              Atualizar Estatísticas
            </Button>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Gerenciamento</CardTitle>
            <CardDescription>
              Faça backup, restaure ou limpe os dados do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exportar */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Download className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold">Exportar Dados</h3>
                  <p className="text-sm text-muted-foreground">
                    Baixe todos os dados como arquivo JSON
                  </p>
                </div>
              </div>
              <Button onClick={handleExport} className="w-full" variant="default">
                <Download className="mr-2 h-4 w-4" />
                Exportar Backup
              </Button>
            </div>

            {/* Importar */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Upload className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold">Importar Dados</h3>
                  <p className="text-sm text-muted-foreground">
                    Restaure dados de um arquivo de backup
                  </p>
                </div>
              </div>
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="w-full"
                variant="default"
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar Arquivo
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Limpar */}
            <div className="border border-destructive/50 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Limpar Dados</h3>
                  <p className="text-sm text-muted-foreground">
                    Remove TODOS os dados permanentemente
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowClearDialog(true)}
                className="w-full"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info sobre localStorage */}
      <Alert className="mt-6">
        <FileJson className="h-4 w-4" />
        <AlertTitle>Sobre o armazenamento de dados</AlertTitle>
        <AlertDescription>
          Os dados são armazenados no <strong>localStorage</strong> do navegador. Isso significa que:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Dados são específicos por domínio (localhost vs produção têm storage separado)</li>
            <li>Não há sincronização automática entre dispositivos</li>
            <li>Dados podem ser perdidos ao limpar cache do navegador</li>
            <li>
              <strong>Use a exportação regular para fazer backup dos seus dados!</strong>
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Dialog: Importar */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Dados</DialogTitle>
            <DialogDescription>
              Arquivo selecionado: <strong>{selectedFile?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modo de Importação</Label>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as any)}>
                <div className="flex items-start space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="merge" id="merge" />
                  <div className="flex-1">
                    <Label htmlFor="merge" className="font-semibold cursor-pointer">
                      Mesclar (Recomendado)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Adiciona novos dados e atualiza existentes. Não remove dados atuais.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="replace" id="replace" />
                  <div className="flex-1">
                    <Label htmlFor="replace" className="font-semibold cursor-pointer">
                      Substituir
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Remove TODOS os dados atuais e substitui pelos dados do arquivo.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {importMode === 'replace' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  Modo "Substituir" irá REMOVER todos os dados atuais. Recomendamos fazer um backup
                  antes.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false)
                setSelectedFile(null)
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Limpar */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Limpeza de Dados
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>IRREVERSÍVEL</strong> e irá remover:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  <li>{stats.clinics} clínicas</li>
                  <li>{stats.patients} pacientes</li>
                  <li>{stats.aligners} registros de alinhadores</li>
                  <li>{stats.missionTemplates} templates de missão</li>
                  <li>{stats.patientMissions} missões de pacientes</li>
                  <li>{stats.stories} histórias geradas</li>
                </ul>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Recomendamos fazer um backup antes de limpar os dados.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={isProcessing}>
              {isProcessing ? 'Limpando...' : 'Sim, Limpar Tudo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminDataManagement
