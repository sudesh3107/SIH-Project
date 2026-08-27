'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Library,
  Users,
  User,
  LogOut,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/trainer/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/trainer/courses', icon: BookOpen },
  { name: 'Questionnaires', href: '/trainer/questionnaires', icon: FileText },
  { name: 'Trainees', href: '/trainer/trainees', icon: Users },
  { name: 'Library', href: '/trainer/library', icon: Library },
  { name: 'Profile', href: '/trainer/profile', icon: User },
]

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 lg:translate-x-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
              <Link href="/trainer/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Capacity Connect</span>
              </Link>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {(session?.user as any)?.role?.toLowerCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="mt-3 w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 lg:pl-64 min-w-0">
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Dashboard'}
              </h1>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
