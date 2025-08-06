# 📌 Issue Tracker App

A simple issue tracking system built with **Next.js**, **Prisma**, and **PostgreSQL**.  
Manage tasks, assign issues, set priorities, and track project progress.

## 🚀 Features
- User authentication (BetterAuth)
- Create, update, delete issues
- Assign issues to users
- Priority, status, due date, and labels
- PostgreSQL database with Prisma ORM
- Responsive UI with Tailwind + ShadCN UI

## 🛠️ Tech Stack
- **Frontend:** Next.js (App Router), React Hook Form, Zod
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma
- **Auth:** BetterAuth.js (Credentials)
- **UI:** Tailwind CSS + ShadCN UI

## ⚙️ Setup
```bash
# Clone repository
git clone https://github.com/yourusername/issue-tracker.git
cd issue-tracker

# Install dependencies
npm install

# Create .env file
DATABASE_URL="your_postgres_url"
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
