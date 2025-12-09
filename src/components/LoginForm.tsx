import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export const LoginForm = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      await login({ credential, password })
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="credential">E-mail / CPF / Registro Profissional</Label>
        <Input
          id="credential"
          type="text"
          placeholder="Digite sua credencial"
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Esqueceu sua senha?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>
      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-card px-2 text-sm text-muted-foreground">
          OU
        </span>
      </div>
      <div className="space-y-2">
        <Button variant="outline" className="w-full">
          <img
            src="https://img.usecurling.com/i?q=google&color=multicolor"
            alt="Google"
            className="mr-2 h-5 w-5"
          />
          Entrar com Google
        </Button>
        <Button variant="outline" className="w-full">
          <img
            src="https://img.usecurling.com/i?q=apple&color=solid-black"
            alt="Apple"
            className="mr-2 h-5 w-5"
          />
          Entrar com Apple
        </Button>
      </div>
    </form>
  )
}
