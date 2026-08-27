'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { BookOpen, FileText, Award, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { name: 'Enrolled Courses', value: '5', change: '+2 this month', icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Completed', value: '2', change: '1 in progress', icon: Award, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { name: 'Assessments', value: '8', change: '3 pending', icon: FileText, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Learning Hours', value: '24', change: '5h this week', icon: Clock, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
]

const recentCourses = [
  { id: '1', title: 'Advanced Meteorology', progress: 65, lessons: 12, completed: 8, thumbnail: null },
  { id: '2', title: 'Climate Data Analysis', progress: 30, lessons: 8, completed: 2, thumbnail: null },
  { id: '3', title: 'Weather Forecasting Models', progress: 90, lessons: 10, completed: 9, thumbnail: null },
]

const upcomingAssessments = [
  { id: '1', title: 'Meteorology Fundamentals Quiz', course: 'Advanced Meteorology', deadline: '2026-09-01', questions: 20 },
  { id: '2', title: 'Climate Models Assessment', course: 'Climate Data Analysis', deadline: '2026-09-05', questions: 15 },
]

export default function TraineeDashboard() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here's your learning progress overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} href="#" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.change}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Courses & Upcoming Assessments */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Continue Learning */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Continue Learning</h3>
            <Link href="/trainee/courses" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentCourses.map((course) => (
              <Link key={course.id} href={`/trainee/courses/${course.id}`} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{course.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{course.completed}/{course.lessons} lessons</p>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${course.progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.progress}% complete</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Assessments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Assessments</h3>
            <Link href="/trainee/assessments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingAssessments.map((assessment) => (
              <div key={assessment.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white">{assessment.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{assessment.course}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {assessment.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due: {new Date(assessment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link href={`/trainee/assessments/${assessment.id}`} className="btn-primary text-sm px-3 py-1.5 flex-shrink-0">
                    Start
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/trainee/courses?view=browse" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <BookOpen className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Browse Courses</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Discover new courses</p>
          </Link>
          <Link href="/trainee/library" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <Library className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Resource Library</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Access materials</p>
          </Link>
          <Link href="/trainee/assessments" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <FileText className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Practice Tests</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Take assessments</p>
          </Link>
          <Link href="/trainee/profile" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <Award className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">My Certificates</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">View achievements</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
