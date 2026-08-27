'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['TRAINEE', 'TRAINER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'TRAINEE' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }

      router.push('/auth/login?registered=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Capacity Connect</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Join the learning platform</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name')}
                className={cn('input-field', errors.name && 'border-red-500 focus:ring-red-500')}
                placeholder="John Doe"
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={cn('input-field', errors.email && 'border-red-500 focus:ring-red-500')}
                placeholder="you@organization.gov.in"
                disabled={isLoading}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className={cn('input-field', errors.password && 'border-red-500 focus:ring-red-500')}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={cn('input-field', errors.confirmPassword && 'border-red-500 focus:ring-red-500')}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <label className="label">Register As</label>
              <div className="grid grid-cols-2 gap-3">
                {['TRAINEE', 'TRAINER'].map((role) => (
                  <label
                    key={role}
                    className={cn(
                      'relative cursor-pointer',
                      selectedRole === role && 'ring-2 ring-primary-500'
                    )}
                  >
                    <input
                      type="radio"
                      value={role}
                      {...register('role')}
                      className="sr-only"
                    />
                    <div className={cn(
                      'p-4 rounded-lg border-2 text-center transition-all',
                      selectedRole === role
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    )}>
                      <div className="font-medium text-gray-900 dark:text-white capitalize">{role.toLowerCase()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {role === 'TRAINEE' ? 'Learn & grow' : 'Teach & mentor'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Trainer accounts require admin approval. Trainee accounts are auto-approved.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
