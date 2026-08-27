'use client'

import { Users, BookOpen, FileText, Award, TrendingUp, Clock, UserCheck, UserX, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const stats = [
  { name: 'Total Users', value: '2,847', change: '+156 this month', icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { name: 'Active Courses', value: '142', change: '+8 this quarter', icon: BookOpen, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  { name: 'Assessments Taken', value: '12,450', change: '+2.3k this month', icon: FileText, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  { name: 'Certifications', value: '3,210', change: '+340 this month', icon: Award, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
]

const userStats = [
  { label: 'Trainees', value: '2,150', icon: UserCheck, color: 'text-blue-600' },
  { label: 'Trainers', value: '187', icon: UserCheck, color: 'text-green-600' },
  { label: 'Admins', value: '12', icon: UserCheck, color: 'text-purple-600' },
  { label: 'Pending Approval', value: '23', icon: UserX, color: 'text-yellow-600' },
]

const recentActivity = [
  { type: 'user', message: 'New trainee registered: priya.sharma@imd.gov.in', time: '5 min ago', icon: UserCheck, color: 'text-blue-600 bg-blue-100' },
  { type: 'course', message: 'Course "Weather Radar Operations" published by Dr. Kumar', time: '15 min ago', icon: BookOpen, color: 'text-green-600 bg-green-100' },
  { type: 'assessment', message: 'Assessment "Monsoon Prediction" completed by 45 trainees', time: '1 hour ago', icon: FileText, color: 'text-purple-600 bg-purple-100' },
  { type: 'certification', message: 'Certificate issued to Rahul Verma for "Advanced Meteorology"', time: '2 hours ago', icon: Award, color: 'text-orange-600 bg-orange-100' },
  { type: 'alert', message: '3 trainer accounts pending approval for 48+ hours', time: '3 hours ago', icon: AlertCircle, color: 'text-red-600 bg-red-100' },
]

const topCourses = [
  { title: 'Advanced Meteorology', enrollments: 342, completionRate: 78, rating: 4.8 },
  { title: 'Climate Data Analysis', enrollments: 287, completionRate: 82, rating: 4.9 },
  { title: 'Weather Forecasting Models', enrollments: 198, completionRate: 75, rating: 4.7 },
  { title: 'Satellite Meteorology', enrollments: 156, completionRate: 85, rating: 4.8 },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">System overview and key metrics</p>
      </div>

      {/* Main Stats */}
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Breakdown */}
        <div className="lg:col-span-1 card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Breakdown</h3>
          <div className="space-y-4">
            {userStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', `${stat.color} bg-opacity-10`)}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{stat.label}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/users?status=pending" className="block mt-4 text-center text-sm text-primary-600 hover:text-primary-700">
            View pending approvals →
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', activity.color)}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/admin/activity" className="text-sm text-primary-600 hover:text-primary-700">
              View all activity →
            </Link>
          </div>
        </div>
      </div>

      {/* Top Courses & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Courses by Enrollment</h3>
          <div className="space-y-3">
            {topCourses.map((course, i) => (
              <div key={course.title} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="w-8 text-center text-lg font-bold text-gray-500 dark:text-gray-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{course.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrollments} enrolled</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {course.completionRate}% completion</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {course.rating}/5.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/users/new" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
              <UserCheck className="w-8 h-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Add User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Create new account</p>
            </Link>
            <Link href="/admin/courses/new" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
              <BookOpen className="w-8 h-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Create Course</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Add new course</p>
            </Link>
            <Link href="/admin/notifications/new" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
              <Bell className="w-8 h-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Send Notification</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Broadcast to users</p>
            </Link>
            <Link href="/admin/competency" className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
              <Target className="w-8 h-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">Competency Map</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage mappings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
