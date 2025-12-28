#!/bin/bash

echo "=========================================="
echo "EnglishPro - Starting Development Server"
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

# Check if services are running
echo ""
echo "Checking services..."

# Check PostgreSQL
if ! pg_isready -q 2>/dev/null; then
    print_warning "Starting PostgreSQL..."
    brew services start postgresql@16
    sleep 2
fi

if pg_isready -q 2>/dev/null; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL failed to start"
    echo "Try: brew services restart postgresql@16"
    exit 1
fi

# Check Redis
if ! redis-cli ping &>/dev/null; then
    print_warning "Starting Redis..."
    brew services start redis
    sleep 1
fi

if redis-cli ping &>/dev/null; then
    print_status "Redis is running"
else
    print_error "Redis failed to start"
    echo "Try: brew services restart redis"
    exit 1
fi

echo ""
echo "=========================================="
echo "Starting development servers..."
echo "=========================================="
echo ""
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API:      http://localhost:8000/api"
echo "  Health:   http://localhost:8000/api/health"
echo ""
echo "Login credentials: see .credentials file"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=========================================="
echo ""

# Start both servers
npm run dev
