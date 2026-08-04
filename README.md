# EduEthiopia AI - Grades 1–12 AI Study Platform

A full-stack AI-powered study platform designed specifically for Ethiopian students (Grades 1–12). Upload study materials, PDFs, photos, or YouTube links to instantly generate structured AI Study Notes, Custom Quizzes, and Interactive Flashcards in English or Amharic (አማርኛ).

---

## 🚀 Deployment Guide for Render (Render.com)

To deploy this application as a Web Service on Render:

### 1. Create a Web Service on Render
1. Sign in to [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.

### 2. Configure Build & Start Settings
* **Name**: `eduethiopia-ai` (or your preferred name)
* **Environment**: `Node`
* **Region**: Any preferred region (e.g., Frankfurt, Oregon)
* **Branch**: `main`
* **Build Command**:
  ```bash
  npm run build
  ```
* **Start Command**:
  ```bash
  npm start
  ```

### 3. Set Environment Variables in Render
In the **Environment Variables** section on Render, add:
* `GEMINI_API_KEY` = *Your Gemini API Key from Google AI Studio*
* `PORT` = `10000` (Render sets `PORT` automatically, `server.ts` automatically uses `process.env.PORT`)

---

## 💡 Why GitHub Repository Showed Only `README.md`

When creating a new repository on GitHub:
1. If you check **"Add a README.md file"** on GitHub when initializing a new repo, GitHub creates a commit with an empty `README.md`.
2. When Google AI Studio attempts to push the workspace code, Git detects conflicting histories (unrelated histories), preventing AI Studio from replacing the branch, leaving only GitHub's initial `README.md`.

### How to Fix & Push Full Source Code to GitHub:

#### Option A: Create an Empty GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Type your Repository name.
3. **DO NOT check** "Add a README file", "Add .gitignore", or "Choose a license". Keep it completely empty!
4. Click **Create repository**.
5. Re-run the Google AI Studio Export to GitHub.

#### Option B: Force Push from Your Computer
If you already created the repository on GitHub, run these commands in your local terminal inside the extracted project folder:

```bash
git init
git add .
git commit -m "Initial commit of EduEthiopia AI platform"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main --force
```

---

## 🛠️ Local Development

### Installation
```bash
# Install dependencies
npm install

# Build client and server
npm run build

# Start production server locally
npm start
```

### Dev Mode
```bash
npm run dev
```

---

## 🔐 Owner Admin Access & Settings
* **Admin Email**: `makieyosiyas83@gmail.com`
* **Admin Password**: `eyosiyasmaki123@`
* **Telebirr Receiving Number**: `0956778184`
