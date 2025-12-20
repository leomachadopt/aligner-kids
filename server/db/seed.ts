/**
 * Database Seed Script
 * Creates initial super-admins and demo clinic
 */

import {
  db,
  users,
  clinics,
  store_items,
  store_item_templates,
  clinic_store_items,
  reward_programs,
  reward_program_items,
  story_options,
  story_option_templates,
  education_lessons,
} from './index'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { RewardProgramAssignmentService } from '../services/rewardProgramAssignmentService'

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
          gamificationConfig: {
            store: {
              requirePinForApproval: true,
              dailySpendLimitCoins: 300,
              cooldownHoursByItemId: {},
            },
          },
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

    // 3. Seed Global Store Catalog
    console.log('\n🛍️  Seeding store catalog (legacy + templates v2)...')
    const existingItems = await db.select().from(store_items).limit(1)
    if (existingItems.length > 0) {
      console.log('✅ Store catalog already seeded')
    } else {
      const now = Date.now()
      const items = [
        // Digital
        {
          id: `store-${now}-frame-1`,
          name: 'Moldura: Arco-Íris',
          description: 'Uma moldura colorida para suas fotos mágicas.',
          type: 'digital',
          category: 'photo_frame',
          priceCoins: 40,
          requiredLevel: 1,
          imageUrl: 'https://img.usecurling.com/p/400/300?q=rainbow%20frame',
          metadata: { slot: 'photo_frame' },
          isActive: true,
        },
        {
          id: `store-${now}-story-1`,
          name: 'Item de História: Novo Personagem',
          description: 'Desbloqueia um personagem extra no Diretor de Histórias.',
          type: 'digital',
          category: 'story_unlock',
          priceCoins: 80,
          requiredLevel: 2,
          imageUrl: 'https://img.usecurling.com/p/400/300?q=cute%20sidekick%20character',
          metadata: { unlock: 'character' },
          isActive: true,
        },
        // Real rewards (vouchers)
        {
          id: `store-${now}-voucher-1`,
          name: 'Vale: Escolher o Filme',
          description: 'Você escolhe o filme da noite. Precisa aprovação do responsável.',
          type: 'real',
          category: 'voucher',
          priceCoins: 120,
          requiredLevel: 2,
          imageUrl: 'https://img.usecurling.com/p/400/300?q=movie%20ticket%20cute',
          metadata: { requiresApproval: true },
          isActive: true,
        },
        {
          id: `store-${now}-voucher-2`,
          name: 'Vale: Brincadeira Especial',
          description: 'Vale uma brincadeira especial hoje. Precisa aprovação do responsável.',
          type: 'real',
          category: 'voucher',
          priceCoins: 150,
          requiredLevel: 3,
          imageUrl: 'https://img.usecurling.com/p/400/300?q=kids%20play%20toy',
          metadata: { requiresApproval: true },
          isActive: true,
        },
      ]

      await db.insert(store_items).values(items as any)
      console.log(`✅ Store catalog seeded (${items.length} items)`)
    }

    // 4. Seed Store Item Templates (v2)
    console.log('\n🧩 Seeding store_item_templates (v2)...')
    async function ensureTemplate(t: any) {
      const existing = await db.select().from(store_item_templates).where(eq(store_item_templates.id, t.id))
      if (existing.length > 0) {
        await db
          .update(store_item_templates)
          .set({
            name: t.name,
            description: t.description,
            type: t.type,
            category: t.category,
            defaultPriceCoins: t.defaultPriceCoins,
            defaultRequiredLevel: t.defaultRequiredLevel,
            defaultImageUrl: t.defaultImageUrl || null,
            metadata: t.metadata || {},
            isActive: t.isActive ?? true,
            updatedAt: new Date(),
          } as any)
          .where(eq(store_item_templates.id, t.id))
        return { created: false }
      }

      await db.insert(store_item_templates).values({
        ...t,
        defaultImageUrl: t.defaultImageUrl || null,
        metadata: t.metadata || {},
        isActive: t.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      return { created: true }
    }

    const baseTemplates = [
      {
        id: 'tpl-global-frame-rainbow',
        name: 'Moldura: Arco-Íris',
        description: 'Uma moldura colorida para suas fotos mágicas (com download aplicado).',
        type: 'digital',
        category: 'photo_frame',
        defaultPriceCoins: 40,
        defaultRequiredLevel: 1,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=rainbow%20frame%20transparent',
        metadata: {
          slot: 'photo_frame',
          exportMode: 'burn',
          frameStyle: 'rainbow',
          overlayUrl: '/rewards/frames/rainbow-frame.svg',
          previewSampleUrl: 'https://img.usecurling.com/p/800/450?q=smiling%20kid%20portrait',
        },
        isActive: true,
      },
      {
        id: 'tpl-global-voucher-movie',
        name: 'Vale: Escolher o Filme',
        description: 'Você escolhe o filme da noite. Precisa aprovação do responsável.',
        type: 'real',
        category: 'voucher',
        defaultPriceCoins: 120,
        defaultRequiredLevel: 2,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=movie%20ticket%20cute',
        metadata: { requiresApproval: true },
        isActive: true,
      },
      {
        id: 'tpl-global-voucher-play',
        name: 'Vale: Brincadeira Especial',
        description: 'Vale uma brincadeira especial hoje. Precisa aprovação do responsável.',
        type: 'real',
        category: 'voucher',
        defaultPriceCoins: 150,
        defaultRequiredLevel: 3,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=kids%20play%20toy',
        metadata: { requiresApproval: true },
        isActive: true,
      },
    ]

    const storyPacks = [
      {
        id: 'tpl-pack-story-sereia-submarino',
        name: 'Pack História: Sereia Submarina',
        description: 'Desbloqueia Sereia Curiosa, Base Submarina e o tema Caça ao Tesouro.',
        type: 'digital',
        category: 'story_unlock',
        defaultPriceCoins: 120,
        defaultRequiredLevel: 2,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=mermaid%20submarine%20kids%20illustration',
        metadata: {
          unlock: 'story_options',
          addCharacters: ['sereia'],
          addEnvironments: ['submarino'],
          addThemes: ['tesouro'],
        },
        isActive: true,
      },
      {
        id: 'tpl-pack-story-detetive-enigmas',
        name: 'Pack História: Detetive dos Enigmas',
        description: 'Desbloqueia Detetive Mirim, Biblioteca Infinita e o tema Enigmas e Pistas.',
        type: 'digital',
        category: 'story_unlock',
        defaultPriceCoins: 120,
        defaultRequiredLevel: 2,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=kids%20detective%20puzzle%20library%20illustration',
        metadata: {
          unlock: 'story_options',
          addCharacters: ['detetive'],
          addEnvironments: ['biblioteca-infinita'],
          addThemes: ['enigmas'],
        },
        isActive: true,
      },
      {
        id: 'tpl-pack-story-cientista-laboratorio',
        name: 'Pack História: Cientista no Laboratório',
        description: 'Desbloqueia Cientista Inventor, Laboratório Secreto e o tema Mistura de Ciências.',
        type: 'digital',
        category: 'story_unlock',
        defaultPriceCoins: 140,
        defaultRequiredLevel: 3,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=kids%20scientist%20laboratory%20fun%20illustration',
        metadata: {
          unlock: 'story_options',
          addCharacters: ['cientista'],
          addEnvironments: ['laboratorio'],
          addThemes: ['mistura-de-ciencias'],
        },
        isActive: true,
      },
      {
        id: 'tpl-pack-story-dino-parque',
        name: 'Pack História: Dino no Parque',
        description: 'Desbloqueia Dinossauro Gentil, Parque dos Dinossauros e o tema Coração Valente.',
        type: 'digital',
        category: 'story_unlock',
        defaultPriceCoins: 140,
        defaultRequiredLevel: 3,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=cute%20dinosaur%20park%20kids%20adventure%20illustration',
        metadata: {
          unlock: 'story_options',
          addCharacters: ['dinossauro'],
          addEnvironments: ['parque-dinossauros'],
          addThemes: ['coracao-valente'],
        },
        isActive: true,
      },
      {
        id: 'tpl-pack-story-circo-festival',
        name: 'Pack História: Circo Estelar',
        description: 'Desbloqueia Capitã das Estrelas, Circo Estelar e o tema Festival Mágico.',
        type: 'digital',
        category: 'story_unlock',
        defaultPriceCoins: 160,
        defaultRequiredLevel: 4,
        defaultImageUrl: 'https://img.usecurling.com/p/600/400?q=space%20circus%20kids%20festival%20illustration',
        metadata: {
          unlock: 'story_options',
          addCharacters: ['capitao'],
          addEnvironments: ['circo-estelar'],
          addThemes: ['festival'],
        },
        isActive: true,
      },
    ]

    // Always ensure base templates + packs exist (idempotent)
    const toEnsure = [...baseTemplates, ...storyPacks]
    let createdCount = 0
    let updatedCount = 0
    for (const t of toEnsure) {
      const r = await ensureTemplate(t)
      if (r.created) createdCount++
      else updatedCount++
    }
    console.log(`✅ store_item_templates ensured (${createdCount} created, ${updatedCount} updated)`)

    // 5. Seed demo clinic catalog + reward programs (v2)
    console.log('\n🏥 Seeding clinic catalog + reward programs (v2) for demo clinic...')
    if (demoClinic?.id) {
      const existingClinicCatalog = await db
        .select()
        .from(clinic_store_items)
        .where(eq(clinic_store_items.clinicId, demoClinic.id))
        .limit(1)

      if (existingClinicCatalog.length > 0) {
        console.log('✅ Clinic catalog already exists')
      } else {
        const tpl = await db.select().from(store_item_templates)
        const createdByUserId = superAdmins[1] ? 'user-seed' : 'user-seed'
        const rows = tpl.filter((t: any) => t.isActive).map((t: any, idx: number) => ({
          id: `citem-seed-${Date.now()}-${idx}`,
          clinicId: demoClinic.id,
          sourceType: 'global_template',
          sourceTemplateId: t.id,
          createdByUserId,
          name: t.name,
          description: t.description,
          type: t.type,
          category: t.category,
          priceCoins: t.defaultPriceCoins,
          requiredLevel: t.defaultRequiredLevel,
          imageUrl: t.defaultImageUrl || null,
          metadata: t.metadata || {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))

        if (rows.length > 0) {
          await db.insert(clinic_store_items).values(rows as any)
          console.log(`✅ Clinic catalog seeded (${rows.length} items)`)
        }
      }

      const existingPrograms = await db
        .select()
        .from(reward_programs)
        .where(eq(reward_programs.clinicId, demoClinic.id))
        .limit(1)

      if (existingPrograms.length > 0) {
        console.log('✅ Reward programs already exist')
      } else {
        const createdByUserId = 'user-seed'
        const p6_8 = await db.insert(reward_programs).values({
          id: `rprog-${Date.now()}-6-8`,
          clinicId: demoClinic.id,
          name: 'Programa 6–8',
          description: 'Prêmios sugeridos para crianças de 6 a 8 anos',
          ageMin: 6,
          ageMax: 8,
          createdByUserId,
          isActive: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning()

        const p9_12 = await db.insert(reward_programs).values({
          id: `rprog-${Date.now()}-9-12`,
          clinicId: demoClinic.id,
          name: 'Programa 9–12',
          description: 'Prêmios sugeridos para crianças de 9 a 12 anos',
          ageMin: 9,
          ageMax: 12,
          createdByUserId,
          isActive: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning()

        const clinicItems = await db
          .select()
          .from(clinic_store_items)
          .where(eq(clinic_store_items.clinicId, demoClinic.id))

        const pick = (cats: string[]) =>
          clinicItems.filter((i: any) => cats.includes(i.category)).slice(0, 3)

        const programItemRows: any[] = []
        const addItems = (programId: string, selected: any[]) => {
          selected.forEach((ci: any, idx: number) => {
            programItemRows.push({
              id: `rpi-${Date.now()}-${programId}-${idx}`,
              programId,
              clinicStoreItemId: ci.id,
              sortOrder: idx,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          })
        }

        addItems(p6_8[0].id, pick(['avatar', 'photo_frame', 'voucher']))
        addItems(p9_12[0].id, pick(['story_unlock', 'avatar', 'voucher']))

        if (programItemRows.length > 0) {
          await db.insert(reward_program_items).values(programItemRows)
        }
        console.log('✅ Reward programs seeded')
      }

      // 6. Assign programs for existing patients (best-effort)
      console.log('\n🧠 Recomputing reward program assignment for existing patients...')
      const clinicPatients = await db.select().from(users).where(eq(users.clinicId, demoClinic.id))
      for (const p of clinicPatients as any[]) {
        if (p.role === 'patient' || p.role === 'child-patient') {
          try {
            await RewardProgramAssignmentService.recomputeForPatient(p.id, p.id)
          } catch (e) {
            // ignore
          }
        }
      }
      console.log('✅ Reward program assignment recompute done')
    }

    // 7. Seed Story Option Templates (GLOBAL)
    console.log('\n📖 Seeding story_option_templates (default + extras)...')
    const existingTemplates = await db.select().from(story_option_templates).limit(1)
    if (existingTemplates.length > 0) {
      console.log('✅ story_option_templates already seeded')
    } else {
      const now = new Date()
      const rows: any[] = []

      // If old story_options exists (from previous versions), migrate it.
      const legacy = await db.select().from(story_options).limit(1)
      if (legacy.length > 0) {
        const legacyAll = await db.select().from(story_options)
        const mapped = legacyAll.map((o: any) => ({
          id: o.id,
          type: o.type,
          name: o.name,
          icon: o.icon,
          color: o.color,
          description: o.description || null,
          imageUrl: null,
          isDefault: !!o.isDefault,
          isActive: !!o.isActive,
          sortOrder: Number(o.sortOrder) || 0,
          metadata: o.metadata || {},
          createdByUserId: null,
          createdAt: now,
          updatedAt: now,
        }))
        await db.insert(story_option_templates).values(mapped as any)
        console.log(`✅ story_option_templates migrated from story_options (${mapped.length} records)`)
        return
      }

      // Defaults (existing hard-coded)
      const defaults = {
        environments: [
          { id: 'floresta', name: 'Floresta Mágica', icon: '🌳', color: 'bg-green-500', description: 'Uma floresta encantada cheia de árvores gigantes e criaturas místicas' },
          { id: 'espaco', name: 'Espaço Sideral', icon: '🚀', color: 'bg-blue-600', description: 'Aventuras entre planetas, estrelas e galáxias distantes' },
          { id: 'castelo', name: 'Reino Encantado', icon: '🏰', color: 'bg-purple-500', description: 'Um reino medieval com castelos, dragões e muita magia' },
          { id: 'oceano', name: 'Fundo do Mar', icon: '🌊', color: 'bg-cyan-500', description: 'Explore as profundezas do oceano com sereias e tesouros' },
          { id: 'selva', name: 'Selva Aventureira', icon: '🦁', color: 'bg-orange-500', description: 'Uma selva tropical cheia de animais exóticos e mistérios' },
          { id: 'montanha', name: 'Montanhas Geladas', icon: '⛰️', color: 'bg-slate-400', description: 'Montanhas cobertas de neve com cavernas secretas' },
          { id: 'deserto', name: 'Deserto Misterioso', icon: '🏜️', color: 'bg-yellow-600', description: 'Um deserto com oásis escondidos e antigos segredos' },
          { id: 'cidade-magica', name: 'Cidade Mágica', icon: '✨', color: 'bg-pink-500', description: 'Uma cidade moderna onde a magia e tecnologia se encontram' },
        ],
        characters: [
          { id: 'dragao', name: 'Dragão Amigável', icon: '🐉', color: 'bg-red-500', description: 'Um dragão gentil que adora fazer novos amigos' },
          { id: 'unicornio', name: 'Unicórnio Mágico', icon: '🦄', color: 'bg-pink-400', description: 'Um unicórnio com poderes mágicos especiais' },
          { id: 'robot', name: 'Robô Esperto', icon: '🤖', color: 'bg-gray-500', description: 'Um robô inteligente com muitas invenções legais' },
          { id: 'fada', name: 'Fada Aventureira', icon: '🧚', color: 'bg-purple-400', description: 'Uma fada corajosa que adora explorar' },
          { id: 'super-heroi', name: 'Super-Herói', icon: '🦸', color: 'bg-blue-500', description: 'Um herói com super poderes incríveis' },
          { id: 'princesa', name: 'Princesa Guerreira', icon: '👸', color: 'bg-pink-500', description: 'Uma princesa forte que sabe lutar e liderar' },
          { id: 'cavaleiro', name: 'Cavaleiro Valente', icon: '⚔️', color: 'bg-slate-600', description: 'Um cavaleiro nobre e corajoso' },
          { id: 'astronauta', name: 'Astronauta Explorador', icon: '👨‍🚀', color: 'bg-indigo-500', description: 'Um astronauta que explora novos planetas' },
          { id: 'pirata', name: 'Pirata Aventureiro', icon: '🏴‍☠️', color: 'bg-amber-700', description: 'Um pirata do bem que busca tesouros perdidos' },
          { id: 'mago', name: 'Mago Sábio', icon: '🧙', color: 'bg-violet-600', description: 'Um mago com poderes mágicos extraordinários' },
        ],
        themes: [
          { id: 'aventura', name: 'Grande Aventura', icon: '⚔️', color: 'bg-orange-500', description: 'Uma jornada emocionante cheia de desafios' },
          { id: 'misterio', name: 'Mistério Emocionante', icon: '🔍', color: 'bg-slate-600', description: 'Um mistério intrigante para ser resolvido' },
          { id: 'amizade', name: 'Poder da Amizade', icon: '❤️', color: 'bg-red-400', description: 'Uma história sobre fazer amigos e trabalhar em equipe' },
          { id: 'coragem', name: 'Jornada Corajosa', icon: '💪', color: 'bg-amber-600', description: 'Uma história sobre enfrentar medos e ser corajoso' },
          { id: 'descoberta', name: 'Grande Descoberta', icon: '🔬', color: 'bg-green-500', description: 'Descubra novos lugares e coisas incríveis' },
          { id: 'magia', name: 'Mundo Mágico', icon: '✨', color: 'bg-purple-500', description: 'Uma aventura repleta de magia e encantamento' },
          { id: 'resgate', name: 'Missão de Resgate', icon: '🚨', color: 'bg-blue-600', description: 'Uma missão heroica para salvar alguém especial' },
        ],
      }

      const extras = {
        environments: [
          { id: 'submarino', name: 'Base Submarina', icon: '🫧', color: 'bg-cyan-600', description: 'Uma base secreta no fundo do mar cheia de mistérios' },
          { id: 'nuvens', name: 'Reino das Nuvens', icon: '☁️', color: 'bg-sky-400', description: 'Castelos no céu e pontes de arco-íris' },
          { id: 'vulcao', name: 'Ilha do Vulcão', icon: '🌋', color: 'bg-orange-600', description: 'Uma ilha quente com pedras brilhantes e segredos antigos' },
          { id: 'biblioteca-infinita', name: 'Biblioteca Infinita', icon: '📚', color: 'bg-amber-600', description: 'Corredores sem fim com livros mágicos' },
          { id: 'parque-dinossauros', name: 'Parque dos Dinossauros', icon: '🦖', color: 'bg-green-600', description: 'Dinossauros amigáveis e trilhas cheias de aventuras' },
          { id: 'laboratorio', name: 'Laboratório Secreto', icon: '🧪', color: 'bg-emerald-600', description: 'Experimentos divertidos e invenções incríveis' },
          { id: 'circo-estelar', name: 'Circo Estelar', icon: '🎪', color: 'bg-fuchsia-500', description: 'Um circo que viaja pelas estrelas' },
          { id: 'ilha-flutuante', name: 'Ilhas Flutuantes', icon: '🪁', color: 'bg-indigo-500', description: 'Ilhas no céu onde tudo pode acontecer' },
        ],
        characters: [
          { id: 'sereia', name: 'Sereia Curiosa', icon: '🧜‍♀️', color: 'bg-cyan-500', description: 'Uma sereia que adora explorar e fazer amigos' },
          { id: 'dinossauro', name: 'Dinossauro Gentil', icon: '🦖', color: 'bg-green-500', description: 'Um dino grandão com coração enorme' },
          { id: 'detetive', name: 'Detetive Mirim', icon: '🕵️', color: 'bg-slate-700', description: 'Resolve enigmas com lupa e criatividade' },
          { id: 'cientista', name: 'Cientista Inventor', icon: '🧑‍🔬', color: 'bg-emerald-500', description: 'Inventa coisas legais para ajudar na aventura' },
          { id: 'samurai', name: 'Samurai do Bem', icon: '🥷', color: 'bg-neutral-800', description: 'Ágil e gentil, protege seus amigos' },
          { id: 'capitao', name: 'Capitã das Estrelas', icon: '🧑‍✈️', color: 'bg-indigo-500', description: 'Comanda uma nave e enfrenta desafios com coragem' },
          { id: 'gato-magico', name: 'Gato Mágico', icon: '🐱', color: 'bg-purple-500', description: 'Um gato esperto com truques mágicos' },
          { id: 'gigante-bondoso', name: 'Gigante Bondoso', icon: '🧌', color: 'bg-amber-700', description: 'Forte e protetor, adora ajudar' },
          { id: 'fogueteiro', name: 'Fogueteiro Engenhoso', icon: '🧑‍🚀', color: 'bg-blue-700', description: 'Constrói foguetes e máquinas divertidas' },
          { id: 'jardineira', name: 'Jardineira Encantada', icon: '🪴', color: 'bg-lime-600', description: 'Faz plantas crescerem com um toque de magia' },
        ],
        themes: [
          { id: 'tesouro', name: 'Caça ao Tesouro', icon: '🗺️', color: 'bg-amber-700', description: 'Pistas, mapas e um tesouro incrível' },
          { id: 'festival', name: 'Festival Mágico', icon: '🎉', color: 'bg-pink-500', description: 'Uma festa cheia de surpresas e alegria' },
          { id: 'mistura-de-ciencias', name: 'Mistura de Ciências', icon: '⚗️', color: 'bg-emerald-600', description: 'Experimentos e descobertas super divertidas' },
          { id: 'coracao-valente', name: 'Coração Valente', icon: '🛡️', color: 'bg-blue-600', description: 'Coragem, amizade e superação' },
          { id: 'enigmas', name: 'Enigmas e Pistas', icon: '🧩', color: 'bg-slate-600', description: 'Resolver desafios usando lógica e criatividade' },
          { id: 'musica', name: 'Música e Ritmo', icon: '🎵', color: 'bg-violet-500', description: 'Uma aventura guiada por sons e melodias' },
        ],
      }

      const push = (type: string, opt: any, isDefault: boolean, sortOrder: number) => {
        rows.push({
          id: opt.id,
          type,
          name: opt.name,
          icon: opt.icon,
          color: opt.color,
          description: opt.description || null,
          imageUrl: null,
          isDefault,
          isActive: true,
          sortOrder,
          metadata: {},
          createdByUserId: null,
          createdAt: now,
          updatedAt: now,
        })
      }

      defaults.environments.forEach((o, i) => push('environment', o, true, i))
      defaults.characters.forEach((o, i) => push('character', o, true, i))
      defaults.themes.forEach((o, i) => push('theme', o, true, i))

      extras.environments.forEach((o, i) => push('environment', o, false, 100 + i))
      extras.characters.forEach((o, i) => push('character', o, false, 100 + i))
      extras.themes.forEach((o, i) => push('theme', o, false, 100 + i))

      await db.insert(story_option_templates).values(rows as any)
      console.log(`✅ story_option_templates seeded (${rows.length} records)`)
    }

    // 8. Seed Education Lessons (video + quiz)
    console.log('\n📚 Seeding education_lessons (video + quiz)...')
    const existingLessons = await db.select().from(education_lessons).limit(1)
    if (existingLessons.length > 0) {
      console.log('✅ education_lessons already seeded')
    } else {
      const now = new Date()
      const lessons = [
        {
          id: 'lesson-clean-aligner',
          title: 'Como limpar seu alinhador (modo herói)',
          description: 'Aprenda o passo a passo para manter seu alinhador limpinho e seu sorriso forte.',
          videoUrl: 'https://www.youtube.com/embed/6Fj9f9XfF_w',
          phaseId: null,
          quiz: [
            { id: 'q1', prompt: 'Quando devo limpar o alinhador?', options: ['Só quando sujar muito', 'Todos os dias', 'Uma vez por mês'], correctIndex: 1 },
            { id: 'q2', prompt: 'O que NÃO é recomendado?', options: ['Água morna/fria', 'Escova macia', 'Água muito quente'], correctIndex: 2 },
            { id: 'q3', prompt: 'Qual é o objetivo?', options: ['Deixar o alinhador cheiroso', 'Evitar bactérias e manchas', 'Fazer barulho'], correctIndex: 1 },
          ],
          passPercent: 70,
          rewardCoins: 25,
          rewardXp: 15,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'lesson-food-rules',
          title: 'Regras de comida do super-sorriso',
          description: 'O que pode e o que não pode com alinhador? Vamos descobrir!',
          videoUrl: 'https://www.youtube.com/embed/6Fj9f9XfF_w',
          phaseId: null,
          quiz: [
            { id: 'q1', prompt: 'Para comer, eu devo…', options: ['Tirar o alinhador', 'Comer com ele', 'Mastigar chiclete com ele'], correctIndex: 0 },
            { id: 'q2', prompt: 'Antes de colocar de volta, eu…', options: ['Escovo os dentes', 'Durmo', 'Bebo refrigerante'], correctIndex: 0 },
          ],
          passPercent: 70,
          rewardCoins: 20,
          rewardXp: 12,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]

      await db.insert(education_lessons).values(lessons as any)
      console.log(`✅ education_lessons seeded (${lessons.length} records)`)
    }
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
