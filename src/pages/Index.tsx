import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '@/components/LoginForm'
import { Smile, Sparkles, Shield } from 'lucide-react'

const Index = () => {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container z-10 grid grid-cols-1 items-center gap-8 px-4 md:gap-16 lg:grid-cols-2">
        {/* Left side - Branding */}
        <div className="flex flex-col items-start justify-center space-y-8 text-left">
          {/* Logo and title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 backdrop-blur-sm">
                <Smile className="h-8 w-8 text-primary" />
              </div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                Angel Aligners
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
              Bem-vindo ao seu portal de{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                acompanhamento
              </span>
            </h1>

            <p className="text-lg text-muted-foreground lg:text-xl">
              Acompanhe seu tratamento ortodôntico de forma simples, interativa e moderna.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex items-start gap-3 rounded-xl bg-card/50 p-4 backdrop-blur-sm border border-border/50">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Simples e Intuitivo</h3>
                <p className="text-sm text-muted-foreground">
                  Interface moderna e fácil de usar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-card/50 p-4 backdrop-blur-sm border border-border/50">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Seguro e Confiável</h3>
                <p className="text-sm text-muted-foreground">
                  Seus dados protegidos e seguros
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login card */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md animate-fade-in-up border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 pb-4">
              <CardTitle className="text-center text-3xl font-bold tracking-tight">
                Acesse sua conta
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                Insira seu email para continuar
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <LoginForm />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Novo por aqui?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/5 px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Criar conta
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Index
