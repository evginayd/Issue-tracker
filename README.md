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
```

## 📸 Screenshots

<img width="1912" height="923" alt="issue-tracker-1" src="https://github.com/user-attachments/assets/e4a8a467-ab32-49c3-b6ab-c4ca52b03854" />
<img width="1911" height="925" alt="issue-tracker-2" src="https://github.com/user-attachments/assets/f69986bd-8692-4298-9983-17e2cad802a3" />
<img width="1912" height="925" alt="issue-tracker-3" src="https://github.com/user-attachments/assets/fce1103b-8785-456d-9366-45216cbc6da8" />
<img width="1912" height="922" alt="issue-tracker-4" src="https://github.com/user-attachments/assets/28bf595a-931a-44a4-a3d7-a18d9a919881" />
<img width="1917" height="923" alt="issue-tracker-5" src="https://github.com/user-attachments/assets/09216ec3-0c38-4cd8-83f4-7a0d064fb970" />
<img width="1910" height="926" alt="issue-tracker-6" src="https://github.com/user-attachments/assets/d5ca3b34-a8f0-4379-b55a-c42e2c13215c" />
<img width="1912" height="928" alt="issue-tracker-7" src="https://github.com/user-attachments/assets/13569b95-61c3-49ac-a7c3-90fd54fc34f5" />
<img width="1908" height="927" alt="issue-tracker-8" src="https://github.com/user-attachments/assets/2efd2b88-37c8-4037-ad31-9d38dd25323e" />
