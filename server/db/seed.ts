/**
 * Database Seed Script
 * Creates initial super-admins and demo clinic
 */

import { db, users, clinics } from './index'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // 1. Create Demo Clinic
    console.log('\n📍 Creating demo clinic...')
    const existingClinic = await db
      .select()
      .from(clinics)
      .where(eq(clinics.slug, 'clinica-demo'))

    let demoClinic
    if (existingClinic.length > 0) {
      demoClinic = existingClinic[0]
      console.log('✅ Demo clinic already exists:', demoClinic.name)
    } else {
      const newClinic = await db
        .insert(clinics)
        .values({
          id: `clinic-${Date.now()}`,
          name: 'Clínica Demo Kids Aligner',
          slug: 'clinica-demo',
          country: 'BR',
          email: 'contato@demo.com',
          phone: '(11) 99999-9999',
          addressCity: 'São Paulo',
          addressState: 'SP',
          primaryColor: '#3B82F6',
          subscriptionTier: 'pro',
        })
        .returning()

      demoClinic = newClinic[0]
      console.log('✅ Demo clinic created:', demoClinic.name)
    }

    // 2. Create Super Admins
    console.log('\n👤 Creating super admins...')
    const superAdmins = [
      {
        email: 'admin@kidsaligner.com',
        password: 'admin123',
        fullName: 'Super Admin',
      },
      {
        email: 'leomachadopt@gmail.com',
        password: 'Admin123',
        fullName: 'Leonardo Machado',
      },
    ]

    let created = 0
    for (const admin of superAdmins) {
      // Check if already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, admin.email))

      if (existing.length > 0) {
        console.log(`   ℹ️  ${admin.email} already exists`)
        continue
      }

      // Hash password
      const passwordHash = await bcrypt.hash(admin.password, 10)

      // Create super admin
      await db.insert(users).values({
        id: `user-${Date.now() + created}`,
        email: admin.email,
        password_hash: passwordHash,
        role: 'super-admin',
        fullName: admin.fullName,
        isActive: true,
        isApproved: true,
        emailVerified: true,
      })

      console.log(`   ✅ ${admin.email} created (password: ${admin.password})`)
      created++
    }

    console.log(`\n✅ Seed completed! Created ${created} super admin(s)`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run seed
seed()
  .then(() => {
    console.log('\n🎉 Database seeded successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Seed error:', error)
    process.exit(1)
  })
