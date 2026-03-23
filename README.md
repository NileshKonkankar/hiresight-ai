# HireSight AI 🚀

HireSight AI is an intelligent, modern applicant tracking and resume ranking platform built to streamline the hiring process. By semantically analyzing candidate resumes against a provided Job Description (JD), HireSight AI assigns compatibility scores to each candidate, allowing recruiters to effortlessly shortlist or reject applicants.

---

## ✨ Features

- **Automated Resume Parsing**: Securely upload resumes (PDF, DOCX) and let the AI extract the core information.
- **Semantic Ranking**: Paste your technical and non-technical Job Description. The integrated AI model creates a detailed summary and ranks applicants dynamically.
- **Premium User Experience**: Designed with modern web aesthetics in mind, utilizing dark mode sleekness, glassmorphic glass-cards, and smooth CSS micro-animations.
- **Actionable Insights**: Export candidate reports directly to CSV, sort top applicants globally, and seamlessly update application statuses.
- **Secure Handling**: JWT Bearer token authentication integrated at the Axios interceptor level, coupled with robust React Router route protection. 

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS v3, React Router DOM, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB / Mongoose
- **AI Integration**: OpenAI GPT-based NLP logic
- **Authentication**: Custom JSON Web Tokens (JWT) & bcrypt

---

## 🏎️ Quickstart Guide

Getting the application running locally is extremely straightforward.

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas cluster or local MongoDB instance
- OpenAI API Key

### 2. Environment Setup

**Backend Configuration:**
Navigate to the `Backend` directory and duplicate `.env.example` into a new `.env` file:
```bash
cd Backend
cp .env.example .env
```
Fill out the variables in `.env` with your actual MongoDB URI, a secure JWT Secret, and your OpenAI API Key.

**Frontend Configuration:**
Navigate to the `Frontend` directory and ensure the `.env` file is pointing to your local (or production) backend API:
```bash
cd ../Frontend
cp .env.example .env
```
*(Default is `http://localhost:5000/api`)*

### 3. Installation & Running

Open two terminal windows (one for the Backend, one for the Frontend).

**Terminal 1 (Backend):**
```bash
cd Backend
npm install
npm start
```
*The API will start on `http://localhost:5000`*

**Terminal 2 (Frontend):**
```bash
cd Frontend
npm install
npm run dev
```
*The Vite development server will open instantly on `http://localhost:5173`*

---

## 🔒 Security & Architecture Notes
- **Interceptors**: The application uses Axios interceptors to persistently attach Bearer tokens. If a token expires (401 response), the system unconditionally clears local storage and cleanly kicks the user back to the login gateway.
- **Protected Routes**: React Router handles protected routing globally. Unauthenticated users cannot peek at `/dashboard` or `/upload` paths.

*(This application was continuously refined with AI automation to be completely production-ready.)*
