import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('password123', 12)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  })

  // Create trainer user
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@demo.com' },
    update: {},
    create: {
      email: 'trainer@demo.com',
      name: 'Dr. Rajesh Kumar',
      passwordHash,
      role: 'TRAINER',
      status: 'APPROVED',
      trainerProfile: {
        create: {
          specialization: 'Meteorology & Climate Science',
          experience: '15 years in atmospheric research and operational forecasting',
          bio: 'Senior Scientist at IMD with expertise in monsoon dynamics and numerical weather prediction.',
          competencyTags: ['Meteorology', 'Climate Modeling', 'Weather Forecasting', 'Satellite Meteorology'],
        },
      },
    },
  })

  // Create trainee user
  const trainee = await prisma.user.upsert({
    where: { email: 'trainee@demo.com' },
    update: {},
    create: {
      email: 'trainee@demo.com',
      name: 'Priya Sharma',
      passwordHash,
      role: 'TRAINEE',
      status: 'APPROVED',
      traineeProfile: {
        create: {
          qualifications: 'M.Sc. Atmospheric Science, B.Sc. Physics',
          workExperience: '2 years as Junior Research Fellow at IMD',
          interests: 'Monsoon dynamics, Climate change, Weather forecasting',
          skills: ['Python', 'MATLAB', 'GrADS', 'Data Analysis', 'Scientific Writing'],
          certificates: ['Basic Meteorology Certification', 'Python for Data Science'],
          competencyTags: ['Meteorology', 'Data Analysis', 'Research'],
        },
      },
    },
  })

  // Create sample courses
  const course1 = await prisma.course.upsert({
    where: { id: 'course-1' },
    update: {},
    create: {
      id: 'course-1',
      title: 'Advanced Meteorology',
      description: 'Comprehensive course covering advanced topics in meteorology including atmospheric dynamics, thermodynamics, and weather systems.',
      status: 'PUBLISHED',
      creatorId: trainer.id,
      modules: {
        create: [
          {
            title: 'Atmospheric Fundamentals',
            description: 'Basic concepts of atmospheric science',
            order: 1,
            lessons: {
              create: [
                { title: 'Introduction to Atmosphere', content: 'Overview of atmospheric layers and composition', order: 1, duration: 30 },
                { title: 'Atmospheric Thermodynamics', content: 'Temperature, pressure, humidity relationships', order: 2, duration: 45 },
                { title: 'Radiation and Energy Balance', content: 'Solar and terrestrial radiation', order: 3, duration: 40 },
              ],
            },
          },
          {
            title: 'Weather Systems',
            description: 'Understanding various weather phenomena',
            order: 2,
            lessons: {
              create: [
                { title: 'Pressure Systems', content: 'High and low pressure systems', order: 1, duration: 35 },
                { title: 'Fronts and Air Masses', content: 'Frontal systems and weather changes', order: 2, duration: 40 },
                { title: 'Cyclones and Anticyclones', content: 'Tropical and extratropical cyclones', order: 3, duration: 50 },
              ],
            },
          },
        ],
      },
    },
  })

  const course2 = await prisma.course.upsert({
    where: { id: 'course-2' },
    update: {},
    create: {
      id: 'course-2',
      title: 'Climate Data Analysis',
      description: 'Learn to analyze and visualize climate data using modern tools and techniques.',
      status: 'PUBLISHED',
      creatorId: trainer.id,
      modules: {
        create: [
          {
            title: 'Data Sources & Tools',
            description: 'Overview of climate data sources and analysis tools',
            order: 1,
            lessons: {
              create: [
                { title: 'Climate Data Repositories', content: 'NOAA, ERA5, IMD datasets', order: 1, duration: 30 },
                { title: 'Python for Climate Science', content: 'xarray, pandas, matplotlib basics', order: 2, duration: 60 },
              ],
            },
          },
        ],
      },
    },
  })

  // Create enrollments
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: trainee.id, courseId: course1.id } },
    update: {},
    create: { userId: trainee.id, courseId: course1.id, progress: 65 },
  })

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: trainee.id, courseId: course2.id } },
    update: {},
    create: { userId: trainee.id, courseId: course2.id, progress: 30 },
  })

  // Create sample questionnaire
  const questionnaire = await prisma.questionnaire.upsert({
    where: { id: 'q-1' },
    update: {},
    create: {
      id: 'q-1',
      title: 'Meteorology Fundamentals Quiz',
      description: 'Test your understanding of basic meteorological concepts',
      courseId: course1.id,
      creatorId: trainer.id,
      deadline: new Date('2026-09-01'),
      timeLimit: 30,
      passingScore: 60,
      isPublished: true,
      questions: {
        create: [
          {
            text: 'What is the approximate thickness of the troposphere?',
            type: 'MCQ',
            options: ['8-15 km', '50-80 km', '80-100 km', '100-200 km'],
            correctAnswer: '8-15 km',
            explanation: 'The troposphere extends from surface to about 8-15 km depending on latitude.',
            points: 1,
            order: 1,
          },
          {
            text: 'Which layer contains the ozone layer?',
            type: 'MCQ',
            options: ['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere'],
            correctAnswer: 'Stratosphere',
            explanation: 'The ozone layer is primarily located in the lower stratosphere.',
            points: 1,
            order: 2,
          },
          {
            text: 'Temperature decreases with height in the troposphere.',
            type: 'TRUE_FALSE',
            options: ['True', 'False'],
            correctAnswer: 'True',
            explanation: 'Temperature generally decreases with altitude in the troposphere at ~6.5°C/km.',
            points: 1,
            order: 3,
          },
        ],
      },
    },
  })

  // Create sample course materials
  await prisma.courseMaterial.createMany({
    data: [
      { courseId: course1.id, uploaderId: trainer.id, title: 'Atmospheric Dynamics Lecture Notes', type: 'PDF', url: '/materials/atm-dynamics.pdf', description: 'Complete lecture notes for atmospheric dynamics module' },
      { courseId: course1.id, uploaderId: trainer.id, title: 'Thermodynamics Diagrams', type: 'PDF', url: '/materials/thermo-diagrams.pdf', description: 'Tephigram and skew-T log-P diagrams reference' },
      { courseId: course2.id, uploaderId: trainer.id, title: 'Python Climate Analysis Tutorial', type: 'VIDEO', url: 'https://youtube.com/watch?v=example', description: 'Step-by-step tutorial for climate data analysis in Python' },
    ],
    skipDuplicates: true,
  })

  // Create competency mappings
  await prisma.competencyMapping.upsert({
    where: { subject: 'Meteorology' },
    update: {},
    create: {
      subject: 'Meteorology',
      trainerIds: [trainer.id],
      requiredTags: ['Meteorology', 'Atmospheric Science', 'Weather Forecasting'],
    },
  })

  await prisma.competencyMapping.upsert({
    where: { subject: 'Climate Science' },
    update: {},
    create: {
      subject: 'Climate Science',
      trainerIds: [trainer.id],
      requiredTags: ['Climate Modeling', 'Data Analysis', 'Statistics'],
    },
  })

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: trainee.id, title: 'Welcome to Capacity Connect!', message: 'Your account has been approved. Start exploring courses.', type: 'SUCCESS', link: '/trainee/courses' },
      { userId: trainee.id, title: 'New Course Available', message: 'Advanced Meteorology course is now open for enrollment.', type: 'INFO', link: '/trainee/courses/course-1' },
      { userId: trainer.id, title: 'Course Published', message: 'Your course "Climate Data Analysis" has been published.', type: 'SUCCESS', link: '/trainer/courses/course-2' },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Database seeded successfully!')
  console.log('Demo accounts:')
  console.log('  Admin: admin@demo.com / password123')
  console.log('  Trainer: trainer@demo.com / password123')
  console.log('  Trainee: trainee@demo.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
