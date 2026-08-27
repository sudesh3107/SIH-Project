'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Users, BookOpen, FileText, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const stats = [
  { name: 'Total Courses', value: '8', change: '+2 this quarter', icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Active Trainees', value: '156', change: '+12 this month', icon: Users, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { name: 'Questionnaires', value: '12', change: '3 active', icon: FileText, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Avg. Score', value: '87%', change: '+3% vs last month', icon: TrendingUp, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
]

const myCourses = [
  { id: '1', title: 'Advanced Meteorology', trainees: 45, lessons: 12, status: 'Published', statusColor: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { id: '2', title: 'Climate Data Analysis', trainees: 23, lessons: 8, status: 'Published', statusColor: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { id: '3', title: 'Weather Forecasting Models', trainees: 12, lessons: 10, status: 'Draft', statusColor: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
]

const recentActivity = [
  { type: 'enrollment', user: 'Priya Sharma', action: 'enrolled in', target: 'Advanced Meteorology', time: '2 hours ago' },
  { type: 'assessment', user: 'Rahul Kumar', action: 'completed', target: 'Meteorology Fundamentals Quiz', score: '92%', time: '4 hours ago' },
  { type: 'submission', user: 'Anjali Singh', action: 'submitted', target: 'Climate Models Assessment', time: '6 hours ago' },
  { type: 'enrollment', user: 'Vikram Patel', action: 'enrolled in', target: 'Climate Data Analysis', time: '1 day ago' },
]

export default function TrainerDashboard() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your courses and trainees</p>
        </div>
        <Link href="/trainer/courses/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Course
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card hover:shadow-md transition-shadow">
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
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Courses</h3>
            <Link href="/trainer/courses" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {myCourses.map((course) => (
              <Link key={course.id} href={`/trainer/courses/${course.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{course.title}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {course.trainees} trainees · {course.lessons} lessons
                  </p>
                </div>
                <span className={cn('px-2 py-1 text-xs font-medium rounded-full', course.statusColor)}>
                  {course.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <Link href="/trainer/trainees" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  activity.type === 'enrollment' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                  activity.type === 'assessment' && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                  activity.type === 'submission' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                )}>
                  {activity.type === 'enrollment' && <Users className="w-4 h-4" />}
                  {activity.type === 'assessment' && <FileText className="w-4 h-4" />}
                  {activity.type === 'submission' && <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                    {activity.score && <span className="ml-1 text-green-600 font-semibold">({activity.score})</span>}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
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
          <Link href="/trainer/courses/new" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <Plus className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Create Course</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Build new course</p>
          </Link>
          <Link href="/trainer/questionnaires/new" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <FileText className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Create Quiz</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add assessment</p>
          </Link>
          <Link href="/trainer/library/upload" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <BookOpen className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">Upload Material</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add resources</p>
          </Link>
          <Link href="/trainer/trainees" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
            <Users className="w-8 h-8 mx-auto text-primary-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">View Trainees</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Monitor progress</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
