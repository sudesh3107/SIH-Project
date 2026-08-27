import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['TRAINEE', 'TRAINER']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const status = role === 'TRAINER' ? 'PENDING' : 'APPROVED'

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status,
        ...(role === 'TRAINEE' && {
          traineeProfile: { create: { skills: [], certificates: [], competencyTags: [] } },
        }),
        ...(role === 'TRAINER' && {
          trainerProfile: { create: { competencyTags: [] } },
        }),
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid input', errors: error.errors }, { status: 400 })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
