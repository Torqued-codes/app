# ⚡ TORQ App
 
A full-stack, real-time Todo app built with **Expo** and **Convex** — featuring a stunning gradient UI with dark and light modes, available on both mobile and web.
 
 
## 📱 Screenshots

 
## ✨ Features
 
- ➕ **Add** unlimited todos instantly
- ✏️ **Edit** any todo inline
- 🗑️ **Delete** individual todos
- ✅ **Track** completed, active, and pending tasks in real-time
- 🔄 **Reset App** — wipes all data from the app and Convex database instantly
- 🌗 **Dark & Light gradient modes**
- 🌐 Works on **iOS, Android & Web**
 
 
## 🛠️ Tech Stack
 
| Technology | Purpose |
|------------|---------|
| [Expo](https://expo.dev) | React Native framework |
| [Expo Router](https://expo.github.io/router) | File-based navigation |
| [Convex](https://convex.dev) | Real-time backend & database |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) | Gradient UI |
 
 
## 🚀 Getting Started
 
### Prerequisites
- Node.js
- Expo Go app on your phone
 
### Installation
 
# Clone the repo
git clone https://github.com/torqued-codes/torqapp.git
 
# Navigate into the project
cd torqapp
 
# Install dependencies
npm install
 
# Start the app
npx expo start
 
### Convex Setup

# Install Convex
npm install convex
 
# Initialize Convex
npx convex dev

 
## 📁 Project Structure
 

app/
├── (tabs)/
│   ├── index.tsx        # Home screen (Todos)
│   └── settings.tsx     # Settings screen
├── _layout.tsx          # Root layout
components/
├── Header.tsx
├── TodoInput.tsx
├── EmptyState.tsx
├── LoadingSpinner.tsx
├── DangerZone.tsx
├── Preferences.tsx
└── ProgressStats.tsx
hooks/
└── useTheme.tsx         # Dark/Light mode
convex/
└── todos.ts             # Backend functions

## 🌐 Web Deployment

# Build for web
npx expo export --platform web
 
# Deploy to Vercel
vercel deploy dist/

 
## 📄 License
 
MIT License © 2026
