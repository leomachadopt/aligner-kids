import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { UserRole } from '@/types/user'

type ProfileType = 'paciente' | 'ortodontista'

const Register = () => {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()

  const [profileType, setProfileType] = useState<ProfileType>('paciente')
  const [isMinor, setIsMinor] = useState(false)

  // Campos comuns
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Campos específicos por tipo
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [treatmentCode, setTreatmentCode] = useState('')
  const [cro, setCro] = useState('')
  const [clinicName, setClinicName] = useState('')

  // Campos do responsável (apenas informativo para child-patient)
  const [guardianName, setGuardianName] = useState('')
  const [guardianCpf, setGuardianCpf] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      // Mapear tipo de perfil para role
      let role: UserRole
      if (profileType === 'paciente') {
        role = isMinor ? 'child-patient' : 'patient'
      } else if (profileType === 'ortodontista') {
        role = 'orthodontist'
      } else {
        role = 'patient'
      }

      await register({
        email,
        password,
        confirmPassword,
        role,
        fullName,
        cpf: cpf || undefined,
        birthDate: birthDate || undefined,
        phone,
        cro: cro || undefined,
        clinicName: clinicName || undefined,
        guardianName: guardianName || undefined,
        guardianCpf: guardianCpf || undefined,
        guardianPhone: guardianPhone || undefined,
        treatmentCode: treatmentCode || undefined,
      })

      toast.success('Cadastro realizado com sucesso!')

      if (profileType === 'ortodontista') {
        toast.info('Sua conta está pendente de aprovação. Aguarde o contato da administração.')
      }

      navigate('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar')
    }
  }

  const renderFormFields = () => {
    switch (profileType) {
      case 'paciente':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatmentCode">
                Código de Tratamento (Opcional)
              </Label>
              <Input
                id="treatmentCode"
                placeholder="Código fornecido pela clínica"
                value={treatmentCode}
                onChange={(e) => setTreatmentCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMinor"
                checked={isMinor}
                onCheckedChange={(checked) => setIsMinor(Boolean(checked))}
                disabled={isLoading}
              />
              <Label htmlFor="isMinor">
                Sou menor de idade (os dados de acesso serão dos pais)
              </Label>
            </div>
            {isMinor && (
              <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                <h3 className="font-semibold text-primary">Dados dos Pais/Responsável</h3>
                <p className="text-sm text-muted-foreground">
                  O e-mail e telefone abaixo serão usados para acesso à conta.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="guardianName">
                    Nome Completo do Responsável
                  </Label>
                  <Input
                    id="guardianName"
                    placeholder="Nome completo do pai/mãe ou responsável"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    disabled={isLoading}
                    required={isMinor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianCpf">CPF do Responsável</Label>
                  <Input
                    id="guardianCpf"
                    placeholder="000.000.000-00"
                    value={guardianCpf}
                    onChange={(e) => setGuardianCpf(e.target.value)}
                    disabled={isLoading}
                    required={isMinor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">Telefone do Responsável</Label>
                  <Input
                    id="guardianPhone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    disabled={isLoading}
                    required={isMinor}
                  />
                </div>
              </div>
            )}
          </>
        )
      case 'ortodontista':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cro">Registro Profissional (CRO)</Label>
              <Input
                id="cro"
                placeholder="Seu registro profissional"
                value={cro}
                onChange={(e) => setCro(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicName">Nome da Clínica (Opcional)</Label>
              <Input
                id="clinicName"
                placeholder="Nome da sua clínica"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                disabled={isLoading}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileType">Tipo de Perfil</Label>
              <Select
                onValueChange={(value: ProfileType) => setProfileType(value)}
                defaultValue="paciente"
                disabled={isLoading}
              >
                <SelectTrigger id="profileType">
                  <SelectValue placeholder="Selecione o tipo de perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paciente">Paciente</SelectItem>
                  <SelectItem value="ortodontista">Ortodontista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderFormFields()}

            <div className="space-y-2">
              <Label htmlFor="email">
                E-mail {isMinor && profileType === 'paciente' && '(usar e-mail dos pais)'}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={isMinor && profileType === 'paciente' ? 'email@dospais.com' : 'seu@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefone {isMinor && profileType === 'paciente' && '(usar telefone dos pais)'}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmação de Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {profileType === 'ortodontista' && (
              <p className="text-sm text-muted-foreground">
                Sua conta ficará pendente de aprovação pela administração da
                clínica.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
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
