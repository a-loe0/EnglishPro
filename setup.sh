#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     EnglishPro - Complete Setup          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Make all scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

echo "Step 1/5: Installing Mac dependencies..."
echo "=========================================="
./scripts/01-setup-mac.sh

echo ""
echo "Step 2/5: Initializing project structure..."
echo "=========================================="
./scripts/02-init-project.sh

echo ""
echo "Step 3/5: Setting up environment..."
echo "=========================================="
./scripts/04-setup-env.sh

echo ""
echo "Step 4/5: Setting up database..."
echo "=========================================="
./scripts/03-setup-database.sh

echo ""
echo "Step 5/5: Creating sample data..."
echo "=========================================="
./scripts/05-seed-data.sh

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Setup Complete!                      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "To start development:"
echo "  ./scripts/06-start-dev.sh"
echo ""
echo "Or:"
echo "  npm run dev"
echo ""
echo "Access the app:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API:      http://localhost:8000/api"
echo ""
echo "Login credentials: see .credentials file"
echo "(This file is excluded from git)"
echo ""
