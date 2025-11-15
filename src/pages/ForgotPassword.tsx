import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ForgotPassword = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription>
            Não se preocupe. Insira seu e-mail abaixo para receber um link de
            redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Enviar link de redefinição
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Lembrou sua senha?{' '}
            <Link to="/" className="font-medium text-primary underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ForgotPassword
