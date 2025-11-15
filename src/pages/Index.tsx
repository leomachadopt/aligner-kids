import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '@/components/LoginForm'
import { Button } from '@/components/ui/button'

const Index = () => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div className="container z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="hidden flex-col items-start justify-center text-left md:flex">
          <img
            src="https://img.usecurling.com/i?q=angel-aligners&color=azure"
            alt="Angel Aligners Logo"
            className="mb-6 h-12"
          />
          <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Bem-vindo ao seu portal de acompanhamento
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Monitore seu tratamento ortodôntico com Angel Aligners de forma
            simples e interativa.
          </p>
        </div>
        <Card className="w-full max-w-md animate-fade-in-up shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Acesse sua conta
            </CardTitle>
            <CardDescription>
              Use suas credenciais para entrar no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-6 text-center text-sm">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="font-medium text-primary underline"
              >
                Criar conta
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="absolute bottom-4 w-full text-center">
        <Button variant="ghost" size="sm">
          Adicionar à tela inicial
        </Button>
      </div>
    </div>
  )
}

export default Index
