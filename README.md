# Capacity Connect - Learning Management Portal

A digital capacity building and learning management platform for organizational training, competency development, and knowledge sharing.

## Features

### 🎓 Trainee Portal
- Professional profiles with qualifications, experience, skills, certificates
- Course enrollment and progress tracking
- Subject-wise MCQ assessments with instant feedback
- Learning resource library access
- Course feedback and ratings

### 👨‍🏫 Trainer Portal
- Profile management with specialization and competency tags
- Course creation with modules and lessons
- Questionnaire/quiz creation with deadlines and time limits
- Trainee participation and performance monitoring
- Resource library for uploading lectures, presentations, materials

### 👑 Admin Portal
- User approval and role management (Trainee/Trainer/Admin)
- Comprehensive dashboards for courses, enrollments, assessments, certifications
- Notifications, announcements, achievements publishing
- Competency mapping for trainer-subject matching
- System analytics and participation statistics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Credentials provider)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **UI**: Lucide React icons

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Installation

```bash
# Clone and navigate
cd capacity-connect

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and NEXTAUTH_SECRET

# Set up database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

Visit `http://localhost:3000`

### Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Trainer | trainer@demo.com | password123 |
| Trainee | trainee@demo.com | password123 |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Auth pages (login/register)
│   ├── trainee/           # Trainee portal
│   ├── trainer/           # Trainer portal
│   └── admin/             # Admin portal
├── components/
│   ├── ui/                # Reusable UI components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth config
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types

prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Seed script
```

## Database Schema

Key models:
- **User** - Base user with role (TRAINEE/TRAINER/ADMIN) and status
- **TraineeProfile** - Qualifications, experience, skills, certificates
- **TrainerProfile** - Specialization, experience, competency tags
- **Course** - Courses with modules and lessons
- **Enrollment** - User-course enrollments with progress
- **Questionnaire** - Quizzes with MCQ/True-False questions
- **AssessmentAttempt** - Trainee quiz attempts with scores
- **Feedback** - Course ratings and comments
- **Notification** - System notifications
- **CompetencyMapping** - Subject to trainer/tag mappings

## Development

```bash
# Run dev server
pnpm dev

# Open Prisma Studio
pnpm db:studio

# Run linting
pnpm lint

# Type check
pnpm tsc --noEmit
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| NEXTAUTH_SECRET | Secret for JWT encryption (32+ chars) |
| NEXTAUTH_URL | Application URL (e.g., http://localhost:3000) |

## License

MIT License - Built for Ministry of Earth Sciences (MoES) / India Meteorological Department
# SIH-Project
