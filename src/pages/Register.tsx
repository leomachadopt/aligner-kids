import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type ProfileType = 'paciente' | 'responsavel' | 'ortodontista'

const Register = () => {
  const [profileType, setProfileType] = useState<ProfileType>('paciente')
  const [isMinor, setIsMinor] = useState(false)

  const renderFormFields = () => {
    switch (profileType) {
      case 'paciente':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" placeholder="Seu nome completo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input id="birthDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatmentCode">
                Código de Tratamento (Opcional)
              </Label>
              <Input
                id="treatmentCode"
                placeholder="Código fornecido pela clínica"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMinor"
                checked={isMinor}
                onCheckedChange={(checked) => setIsMinor(Boolean(checked))}
              />
              <Label htmlFor="isMinor">
                Sou menor de idade e preciso de um responsável
              </Label>
            </div>
            {isMinor && (
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="font-semibold">Dados do Responsável</h3>
                <div className="space-y-2">
                  <Label htmlFor="guardianName">
                    Nome Completo do Responsável
                  </Label>
                  <Input
                    id="guardianName"
                    placeholder="Nome do responsável"
                    required={isMinor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianCpf">CPF do Responsável</Label>
                  <Input
                    id="guardianCpf"
                    placeholder="CPF do responsável"
                    required={isMinor}
                  />
                </div>
              </div>
            )}
          </>
        )
      case 'responsavel':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" placeholder="Seu nome completo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientCpf">CPF do Paciente</Label>
              <Input
                id="patientCpf"
                placeholder="CPF do paciente a ser vinculado"
                required
              />
            </div>
          </>
        )
      case 'ortodontista':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" placeholder="Seu nome completo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cro">Registro Profissional (CRO)</Label>
              <Input
                id="cro"
                placeholder="Seu registro profissional"
                required
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg animate-fade-in-up">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para se cadastrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileType">Tipo de Perfil</Label>
              <Select
                onValueChange={(value: ProfileType) => setProfileType(value)}
                defaultValue="paciente"
              >
                <SelectTrigger id="profileType">
                  <SelectValue placeholder="Selecione o tipo de perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Paciente</SelectItem>
                  <SelectItem value="responsavel">Responsável</SelectItem>
                  <SelectItem value="ortodontista">Ortodontista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderFormFields()}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmação de Senha</Label>
              <Input id="confirmPassword" type="password" required />
            </div>

            {profileType === 'ortodontista' && (
              <p className="text-sm text-muted-foreground">
                Sua conta ficará pendente de aprovação pela administração da
                clínica.
              </p>
            )}

            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link to="/" className="font-medium text-primary underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register
