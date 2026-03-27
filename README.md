# HireSight AI 🚀

HireSight AI is an intelligent, modern applicant tracking and resume ranking platform built to streamline the hiring process. By semantically analyzing candidate resumes against a provided Job Description (JD), HireSight AI assigns compatibility scores to each candidate, allowing recruiters to effortlessly shortlist or reject applicants.

---

## ✨ Features

- **Automated Resume Parsing**: Securely upload resumes (PDF) and let the application extract the core information reliably using `pdfjs-dist`.
- **Semantic Ranking**: Paste your technical and non-technical Job Description. The integrated Google Gemini AI model creates a detailed summary and ranks applicants dynamically.
- **Premium User Experience**: Designed with modern web aesthetics in mind, featuring responsive light and dark mode toggles, styling with Tailwind CSS, glassmorphic cards, and smooth CSS micro-animations.
- **Actionable Insights**: Export candidate reports directly to CSV, sort top applicants globally, and seamlessly update application statuses.
- **Secure Handling**: JWT Bearer token authentication integrated at the Axios interceptor level, coupled with robust React Router route protection. 
- **Cloud Deployment Ready**: Pre-configured for easy deployment. Frontend is optimized for Vercel, and backend is optimized for Render, handling dynamic environment-specific base URLs and robust file uploads.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS v3, React Router DOM, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB / Mongoose
- **AI Integration**: Google Gemini API for advanced NLP logic
- **File Parsing**: `pdfjs-dist` for robust PDF text extraction
- **Authentication**: Custom JSON Web Tokens (JWT) & bcrypt

---

## 🏎️ Quickstart Guide

Getting the application running locally is extremely straightforward.

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas cluster or local MongoDB instance
- Google Gemini API Key

### 2. Environment Setup

**Backend Configuration:**
Navigate to the `Backend` directory and duplicate `.env.example` into a new `.env` file:
```bash
cd Backend
cp .env.example .env
```
Fill out the variables in `.env` with your actual MongoDB URI, a secure JWT Secret, and your Google Gemini API Key (e.g., `GEMINI_API_KEY`).

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
- **Deployment**: Architecture ensures seamless communication between frontend (Vercel) and backend (Render).

*(This application was continuously refined with AI automation to be completely production-ready.)*
