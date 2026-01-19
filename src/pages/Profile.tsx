/**
 * Página de Perfil
 * Permite visualizar e editar informações do usuário (pacientes e ortodontistas)
 */

import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Loader2, User, Lock, Mail, Phone, Calendar, Building2, FileText, Camera, X } from 'lucide-react'
import type { UpdateUserInput, ChangePasswordInput } from '@/types/user'
import { ImageCropDialog } from '@/components/ImageCropDialog'

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const { toast } = useToast()

  // Estado para edição de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileData, setProfileData] = useState<UpdateUserInput>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    preferredLanguage: user?.preferredLanguage || 'pt-BR',
    profilePhotoUrl: user?.profilePhotoUrl || '',
  })

  // Ref para input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para crop de imagem
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState('')

  // Estado para mudança de senha
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState<ChangePasswordInput>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isOrthodontist = user.role === 'orthodontist'
  const isChildPatient = user.role === 'child-patient'

  // Handler para atualizar perfil
  const handleUpdateProfile = async () => {
    try {
      setIsSavingProfile(true)
      await updateProfile(profileData)

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      })

      setIsEditingProfile(false)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar o perfil.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handler para mudar senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsChangingPassword(true)
      await changePassword(passwordData)

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      })

      // Limpar campos
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast({
        title: 'Erro ao alterar senha',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao alterar a senha.',
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setProfileData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      birthDate: user.birthDate || '',
      preferredLanguage: user.preferredLanguage || 'pt-BR',
      profilePhotoUrl: user.profilePhotoUrl || '',
    })
    setIsEditingProfile(false)
  }

  // Handler para upload de foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      })
      return
    }

    // Validar tamanho (max 5MB antes do crop)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    // Converter para base64 e abrir modal de crop
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setTempImageSrc(base64String)
      setCropDialogOpen(true)
    }
    reader.readAsDataURL(file)

    // Resetar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = ''
  }

  // Handler para quando o crop for concluído
  const handleCropComplete = (croppedImage: string) => {
    setProfileData({ ...profileData, profilePhotoUrl: croppedImage })
  }

  // Handler para remover foto
  const handleRemovePhoto = () => {
    setProfileData({ ...profileData, profilePhotoUrl: '' })
  }

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      {/* Card de Foto de Perfil */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={isEditingProfile ? profileData.profilePhotoUrl : user.profilePhotoUrl}
                  alt={user.fullName}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>

              {isEditingProfile && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>

              {isEditingProfile && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar Foto
                  </Button>

                  {profileData.profilePhotoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover Foto
                    </Button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* Aba de Informações Pessoais */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome Completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  value={isEditingProfile ? profileData.fullName : user.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  disabled={!isEditingProfile}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                  {isChildPatient && <span className="text-xs text-muted-foreground">(email do responsável)</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={isEditingProfile ? profileData.email : user.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditingProfile}
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={isEditingProfile ? (profileData.phone || '') : (user.phone || '')}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditingProfile}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={isEditingProfile ? (profileData.birthDate || '') : (user.birthDate || '')}
                  onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                  disabled={!isEditingProfile}
                />
              </div>

              {/* Campos específicos para Ortodontistas */}
              {isOrthodontist && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cro" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CRO
                    </Label>
                    <Input
                      id="cro"
                      value={user.cro || 'Não informado'}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicId" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Clínica
                    </Label>
                    <Input
                      id="clinicId"
                      value={user.clinicId || 'Não vinculado'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </>
              )}

              {/* Campos específicos para Pacientes Criança */}
              {isChildPatient && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-4">Informações do Responsável</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Responsável</Label>
                        <Input
                          value={user.guardianName || 'Não informado'}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CPF do Responsável</Label>
                        <Input
                          value={user.guardianCpf || 'Não informado'}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Telefone do Responsável</Label>
                        <Input
                          value={user.guardianPhone || 'Não informado'}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Idioma Preferido */}
              <div className="space-y-2">
                <Label htmlFor="language">Idioma Preferido</Label>
                <select
                  id="language"
                  value={isEditingProfile ? profileData.preferredLanguage : user.preferredLanguage}
                  onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}
                  disabled={!isEditingProfile}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-4">
                {!isEditingProfile ? (
                  <Button onClick={() => setIsEditingProfile(true)}>
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleUpdateProfile} disabled={isSavingProfile}>
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingProfile}>
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Altere sua senha de acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Senha Atual
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Card de informações da conta */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tipo de Conta:</span>
            <span className="font-medium">
              {user.role === 'child-patient' && 'Paciente Infantil'}
              {user.role === 'patient' && 'Paciente'}
              {user.role === 'orthodontist' && 'Ortodontista'}
              {user.role === 'super-admin' && 'Super Administrador'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">
              {user.isActive ? (
                <span className="text-green-600">Ativo</span>
              ) : (
                <span className="text-red-600">Inativo</span>
              )}
            </span>
          </div>
          {user.role === 'orthodontist' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aprovação:</span>
              <span className="font-medium">
                {user.isApproved ? (
                  <span className="text-green-600">Aprovado</span>
                ) : (
                  <span className="text-yellow-600">Pendente</span>
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Membro desde:</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          {user.lastLoginAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Último acesso:</span>
              <span className="font-medium">
                {new Date(user.lastLoginAt).toLocaleDateString('pt-BR')} às{' '}
                {new Date(user.lastLoginAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de crop de imagem */}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  )
}

export default Profile
