/**
 * Authentication Routes
 */

import { Router } from 'express'
import { db, users, aligners, treatments, stories, story_chapters, story_preferences } from '../db/index'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { RewardProgramAssignmentService } from '../services/rewardProgramAssignmentService'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, role, fullName, cpf, birthDate, phone, guardianName, guardianCpf, guardianPhone, cro, clinicId, preferredLanguage } = req.body

    // Validations
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' })
    }

    // Check duplicates
    const existingUser = await db.select().from(users).where(eq(users.email, email))
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await db.insert(users).values({
      id: `user-${Date.now()}`,
      email,
      password_hash: passwordHash,
      role,
      fullName,
      cpf: cpf || null,
      birthDate: birthDate || null,
      phone: phone || null,
      guardianName: guardianName || null,
      guardianCpf: guardianCpf || null,
      guardianPhone: guardianPhone || null,
      cro: cro || null,
      clinicId: clinicId || null,
      preferredLanguage: preferredLanguage || 'pt-BR',
      isApproved: role === 'orthodontist' ? false : true,
    }).returning()

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = newUser[0]

    res.json({
      user: userWithoutPassword,
      token: `token-${newUser[0].id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Error registering user:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { credential, password } = req.body

    console.log('🔐 POST /api/auth/login - Tentativa de login:', { credential })

    // Find user by email, CPF or CRO
    const allUsers = await db.select().from(users)
    const user = allUsers.find(u =>
      u.email === credential ||
      u.cpf === credential ||
      u.cro === credential
    )

    if (!user) {
      console.log('❌ Usuário não encontrado para:', credential)
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    console.log('👤 Usuário encontrado:', user.email, user.fullName)
    console.log('🔑 Senha recebida:', password)
    console.log('🔒 Hash armazenado (primeiros 30 chars):', user.password_hash.substring(0, 30))

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    console.log('🔍 Resultado da comparação bcrypt:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ Senha inválida para:', user.email)
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    console.log('✅ Senha válida')

    // Check if active
    if (!user.isActive) {
      console.log('❌ Conta desativada:', user.email)
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' })
    }

    // Check if approved (orthodontists)
    if (!user.isApproved) {
      console.log('❌ Conta não aprovada:', user.email)
      return res.status(403).json({ error: 'Sua conta está pendente de aprovação. Aguarde o contato da administração.' })
    }

    console.log('✅ Login bem-sucedido para:', user.email)

    // Update last login
    await db.update(users).set({
      lastLoginAt: new Date()
    }).where(eq(users.id, user.id))

    // Auto-assign reward program by age (best-effort)
    try {
      await RewardProgramAssignmentService.recomputeForPatient(user.id, user.id)
    } catch (e) {
      console.warn('⚠️ Falha ao recomputar programa de prêmios:', e)
    }

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user

    res.json({
      user: userWithoutPassword,
      token: `token-${user.id}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// Get current user (verify token)
router.get('/me', async (req, res) => {
  try {
    // In a real app, verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Extract user ID from token (simplified)
    const userId = token.replace('token-', '')

    const result = await db.select().from(users).where(eq(users.id, userId))
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = result[0]
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error getting current user:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// ============================================
// Admin - Users management
// ============================================

// List all users
router.get('/users', async (_req, res) => {
  try {
    const all = await db.select().from(users)
    res.json({ users: all })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Update user profile
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { fullName, email, phone, birthDate, preferredLanguage, profilePhotoUrl, responsiblePin } = req.body

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id))
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update user
    let responsiblePinHash: string | null | undefined = undefined
    if (responsiblePin !== undefined) {
      const pin = String(responsiblePin)
      if (pin.length === 0) {
        responsiblePinHash = null
      } else {
        if (!/^\d{4,8}$/.test(pin)) {
          return res.status(400).json({ error: 'PIN deve ter 4 a 8 dígitos' })
        }
        responsiblePinHash = await bcrypt.hash(pin, 10)
      }
    }

    const updated = await db
      .update(users)
      .set({
        fullName: fullName || existingUser[0].fullName,
        email: email || existingUser[0].email,
        phone: phone || existingUser[0].phone,
        birthDate: birthDate || existingUser[0].birthDate,
        preferredLanguage: preferredLanguage || existingUser[0].preferredLanguage,
        profilePhotoUrl: profilePhotoUrl !== undefined ? profilePhotoUrl : existingUser[0].profilePhotoUrl,
        ...(responsiblePinHash !== undefined ? { responsiblePinHash } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// List pending orthodontists (isApproved = false OR isApproved null)
// NOTE: This must come BEFORE /users/:id to avoid being caught by the param route
router.get('/users/pending', async (_req, res) => {
  try {
    const all = await db.select().from(users)
    const pending = all.filter(
      (u) => u.role === 'orthodontist' && u.isApproved === false,
    )
    res.json({ users: pending })
  } catch (error) {
    console.error('Error fetching pending orthodontists:', error)
    res.status(500).json({ error: 'Failed to fetch pending orthodontists' })
  }
})

// Get single user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await db.select().from(users).where(eq(users.id, id))

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = result[0]
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Approve orthodontist
router.put('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const updated = await db
      .update(users)
      .set({
        isApproved: true,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error approving orthodontist:', error)
    res.status(500).json({ error: 'Failed to approve orthodontist' })
  }
})

// Reject orthodontist (mark as not approved and inactive)
router.put('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const updated = await db
      .update(users)
      .set({
        isApproved: false,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error rejecting orthodontist:', error)
    res.status(500).json({ error: 'Failed to reject orthodontist' })
  }
})

// Deactivate user
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params
    const updated = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error deactivating user:', error)
    res.status(500).json({ error: 'Failed to deactivate user' })
  }
})

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    // Carregar usuário
    const existing = await db.select().from(users).where(eq(users.id, id))
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    const user = existing[0]

    // Cascade delete de dados do paciente
    if (user.role === 'patient' || user.role === 'child-patient') {
      // story chapters -> stories -> preferences
      const patientStories = await db.select().from(stories).where(eq(stories.patientId, id))
      for (const st of patientStories) {
        await db.delete(story_chapters).where(eq(story_chapters.storyId, st.id))
      }
      await db.delete(stories).where(eq(stories.patientId, id))
      await db.delete(story_preferences).where(eq(story_preferences.patientId, id))

      // aligners e treatments
      await db.delete(aligners).where(eq(aligners.patientId, id))
      await db.delete(treatments).where(eq(treatments.patientId, id))
    }

    // Excluir usuário
    await db.delete(users).where(eq(users.id, id))
    res.json({ message: 'User deleted' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Get users by clinic
router.get('/users/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params
    const clinicUsers = await db.select().from(users).where(eq(users.clinicId, clinicId))

    const usersWithoutPasswords = clinicUsers.map(({ password_hash, ...user }) => user)
    res.json({ users: usersWithoutPasswords })
  } catch (error) {
    console.error('Error getting clinic users:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Change password
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params
    const { currentPassword, newPassword, confirmPassword } = req.body

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'As senhas não coincidem' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' })
    }

    // Get user
    const result = await db.select().from(users).where(eq(users.id, id))
    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const user = result[0]

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    await db
      .update(users)
      .set({
        password_hash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    res.json({ message: 'Senha alterada com sucesso' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // Delete user (cascade deletes handled by foreign keys)
    await db.delete(users).where(eq(users.id, userId))

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
