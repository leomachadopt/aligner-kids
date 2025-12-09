/**
 * Página de Debug de Autenticação (apenas desenvolvimento)
 * Acesse via /debug-auth
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAllUsers } from '@/services/authService'
import { AuthService } from '@/services/authService'
import bcrypt from 'bcryptjs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const DebugAuth = () => {
  const [users, setUsers] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState('admin@kidsaligner.com')
  const [testPassword, setTestPassword] = useState('admin123')
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const allUsers = getAllUsers()
    setUsers(allUsers)
  }

  const handleTestLogin = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Primeiro verificar se o usuário existe
      const user = (users as any[]).find((u) => u.email === testEmail)

      if (!user) {
        setTestResult({
          success: false,
          message: 'Usuário não encontrado',
        })
        setIsLoading(false)
        return
      }

      // Testar senha manualmente
      const passwordMatch = await bcrypt.compare(testPassword, user.password_hash)

      if (!passwordMatch) {
        setTestResult({
          success: false,
          message: 'Senha não confere com o hash armazenado',
          details: {
            userFound: true,
            hasPasswordHash: !!user.password_hash,
            passwordMatch: false,
          },
        })
        setIsLoading(false)
        return
      }

      // Tentar login via serviço
      const result = await AuthService.login({
        credential: testEmail,
        password: testPassword,
      })

      setTestResult({
        success: true,
        message: 'Login bem-sucedido!',
        user: result.user,
        details: {
          userFound: true,
          hasPasswordHash: true,
          passwordMatch: true,
          isActive: user.isActive,
          isApproved: user.isApproved,
        },
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearUsers = () => {
    if (window.confirm('⚠️ Isso vai remover TODOS os usuários! Confirma?')) {
      localStorage.removeItem('auth_users')
      localStorage.removeItem('auth_session')
      alert('✅ Usuários removidos. Recarregue a página para recriar os super-admins.')
      loadUsers()
    }
  }

  const handleReloadPage = () => {
    window.location.reload()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Debug de Autenticação</h1>
        <p className="text-muted-foreground mt-2">
          Ferramentas para testar e depurar o sistema de autenticação
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados ({users.length})</CardTitle>
            <CardDescription>Todos os usuários no localStorage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user: any) => (
                <div key={user.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{user.email}</span>
                    <Badge variant={user.isActive ? 'default' : 'destructive'}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Nome: {user.fullName || 'N/A'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {user.isActive ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span>{user.isActive ? 'Ativo' : 'Inativo'}</span>
                      {user.role === 'orthodontist' && (
                        <>
                          <span>•</span>
                          {user.isApproved ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span>{user.isApproved ? 'Aprovado' : 'Pendente'}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1">
                      Password Hash: {user.password_hash ? '✓ Presente' : '✗ Ausente'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={loadUsers} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={handleClearUsers} variant="destructive" size="sm">
                Limpar Todos
              </Button>
              <Button onClick={handleReloadPage} variant="secondary" size="sm">
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teste de Login */}
        <Card>
          <CardHeader>
            <CardTitle>Testar Login</CardTitle>
            <CardDescription>Teste o sistema de autenticação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-password">Senha</Label>
              <Input
                id="test-password"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="senha"
              />
            </div>
            <Button onClick={handleTestLogin} disabled={isLoading} className="w-full">
              {isLoading ? 'Testando...' : 'Testar Login'}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {testResult.message}
                    </div>

                    {testResult.details && (
                      <div className="text-sm space-y-1 mt-2 border-t pt-2">
                        <div>• Usuário encontrado: {testResult.details.userFound ? '✓' : '✗'}</div>
                        <div>
                          • Tem password hash: {testResult.details.hasPasswordHash ? '✓' : '✗'}
                        </div>
                        <div>• Senha confere: {testResult.details.passwordMatch ? '✓' : '✗'}</div>
                        {testResult.details.isActive !== undefined && (
                          <>
                            <div>• Conta ativa: {testResult.details.isActive ? '✓' : '✗'}</div>
                            <div>
                              • Conta aprovada: {testResult.details.isApproved ? '✓' : '✗'}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {testResult.user && (
                      <div className="text-sm mt-2 border-t pt-2">
                        <div className="font-semibold">Usuário Logado:</div>
                        <div>• Email: {testResult.user.email}</div>
                        <div>• Role: {testResult.user.role}</div>
                        <div>• Nome: {testResult.user.fullName}</div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
              <div className="font-semibold">Credenciais Padrão:</div>
              <div>• admin@kidsaligner.com / admin123</div>
              <div>• leomachadopt@gmail.com / Admin123</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DebugAuth
