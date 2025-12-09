/**
 * Authentication Routes
 */

import { Router } from 'express'
import { db, users } from '../db/index'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, role, fullName, cpf, birthDate, phone, guardianName, guardianCpf, guardianPhone, cro, clinicId } = req.body

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

    // Find user by email, CPF or CRO
    const allUsers = await db.select().from(users)
    const user = allUsers.find(u =>
      u.email === credential ||
      u.cpf === credential ||
      u.cro === credential
    )

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' })
    }

    // Check if approved (orthodontists)
    if (!user.isApproved) {
      return res.status(403).json({ error: 'Sua conta está pendente de aprovação. Aguarde o contato da administração.' })
    }

    // Update last login
    await db.update(users).set({
      lastLoginAt: new Date()
    }).where(eq(users.id, user.id))

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
