#!/bin/bash
set -e

echo "=========================================="
echo "EnglishPro - Project Initialization"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo "Project root: $PROJECT_ROOT"

# Initialize root package.json if it doesn't exist
echo ""
echo "Setting up root package.json..."
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "englishpro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "db:migrate": "cd backend && npx prisma migrate dev",
    "db:seed": "cd backend && npx prisma db seed",
    "db:reset": "cd backend && npx prisma migrate reset",
    "db:studio": "cd backend && npx prisma studio",
    "lint": "npm run lint:frontend && npm run lint:backend",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:backend": "cd backend && npm run lint",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
    print_status "Created root package.json"
else
    print_status "Root package.json already exists"
fi

# Create frontend directory and initialize
echo ""
echo "Setting up frontend..."
mkdir -p frontend
cd frontend

if [ ! -f "package.json" ]; then
    # Initialize Vite React TypeScript project
    npm create vite@latest . -- --template react-ts -y 2>/dev/null || npm init vite@latest . -- --template react-ts -y

    print_status "Frontend initialized with Vite + React + TypeScript"

    # Install frontend dependencies
    echo ""
    echo "Installing frontend dependencies..."
    npm install react-router-dom@6 zustand @tanstack/react-query axios
    npm install video.js @types/video.js hls.js
    npm install -D tailwindcss postcss autoprefixer
    npm install -D @types/node

    # Initialize Tailwind
    npx tailwindcss init -p

    # Update tailwind.config.js with custom theme
    cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-light': '#F0F4FF',
        'primary': '#6366F1',
        'accent': '#EC4899',
        'card-purple': '#EDE9FE',
        'video-thumb': '#818CF8',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
EOF

    # Update src/index.css with Tailwind directives
    cat > src/index.css << 'EOF'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
}
EOF

    print_status "TailwindCSS configured with custom theme"

    # Create frontend directory structure
    mkdir -p src/components/common
    mkdir -p src/components/auth
    mkdir -p src/components/video
    mkdir -p src/components/dashboard
    mkdir -p src/components/progress
    mkdir -p src/pages
    mkdir -p src/hooks
    mkdir -p src/services
    mkdir -p src/store
    mkdir -p src/types
    mkdir -p src/utils

    print_status "Frontend directory structure created"
else
    print_status "Frontend already initialized"
fi

cd "$PROJECT_ROOT"

# Create backend directory and initialize
echo ""
echo "Setting up backend..."
mkdir -p backend/src/controllers
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/middleware
mkdir -p backend/src/services
mkdir -p backend/src/utils
mkdir -p backend/prisma

cd backend

if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "englishpro-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "test": "jest"
  }
}
EOF

    print_status "Created backend package.json"

    # Install backend dependencies
    echo ""
    echo "Installing backend dependencies..."
    npm install express cors helmet morgan compression dotenv
    npm install @prisma/client
    npm install jsonwebtoken bcryptjs
    npm install multer uuid
    npm install bull ioredis
    npm install zod express-rate-limit

    npm install -D typescript tsx @types/node @types/express
    npm install -D @types/cors @types/morgan @types/compression
    npm install -D @types/jsonwebtoken @types/bcryptjs
    npm install -D @types/multer @types/uuid
    npm install -D prisma
    npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    npm install -D jest @types/jest ts-jest supertest @types/supertest

    print_status "Backend dependencies installed"

    # Create tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

    print_status "TypeScript configured"

    # Create basic Express server
    cat > src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
EOF

    print_status "Basic Express server created"

    # Initialize Prisma
    npx prisma init --datasource-provider postgresql

    print_status "Prisma initialized"
else
    print_status "Backend already initialized"
fi

cd "$PROJECT_ROOT"

# Install root dependencies
echo ""
echo "Installing root dependencies..."
npm install

print_status "Root dependencies installed"

# Create .gitignore
echo ""
echo "Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Temp files
*.tmp
*.temp
EOF

print_status ".gitignore created"

echo ""
echo "=========================================="
print_status "Project initialization complete!"
echo "=========================================="
echo ""
echo "Project structure:"
echo "  EnglishPro/"
echo "  ├── frontend/     # React + Vite + TypeScript + TailwindCSS"
echo "  ├── backend/      # Express + TypeScript + Prisma"
echo "  ├── scripts/      # Setup scripts"
echo "  └── package.json  # Root workspace"
echo ""
echo "Next: Run ./scripts/03-setup-database.sh"
