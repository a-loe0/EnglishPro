#!/bin/bash
set -e

echo "=========================================="
echo "EnglishPro - Mac Environment Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Add PostgreSQL to PATH (needed for psql command)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Check if Homebrew is installed
echo ""
echo "Checking Homebrew..."
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    print_status "Homebrew installed"
else
    print_status "Homebrew is already installed"
fi

# Update Homebrew
echo ""
echo "Updating Homebrew..."
brew update
print_status "Homebrew updated"

# Check Node.js (v18+ required)
echo ""
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_status "Node.js $(node -v) is already installed and compatible"
    else
        print_warning "Node.js version is too old. Installing latest..."
        brew install node
        print_status "Node.js installed"
    fi
else
    print_warning "Node.js not found. Installing..."
    brew install node
    print_status "Node.js installed"
fi

# Install PostgreSQL
echo ""
echo "Checking PostgreSQL..."
if brew list postgresql@16 &>/dev/null; then
    print_status "PostgreSQL 16 is already installed"
else
    print_warning "Installing PostgreSQL 16..."
    brew install postgresql@16
    print_status "PostgreSQL 16 installed"
fi

# Start PostgreSQL
echo ""
echo "Starting PostgreSQL service..."
brew services start postgresql@16 2>/dev/null || true
sleep 2
if pg_isready -q 2>/dev/null; then
    print_status "PostgreSQL service is running"
else
    print_warning "PostgreSQL may need a moment to start"
fi

# Install Redis
echo ""
echo "Checking Redis..."
if brew list redis &>/dev/null; then
    print_status "Redis is already installed"
else
    print_warning "Installing Redis..."
    brew install redis
    print_status "Redis installed"
fi

# Start Redis
echo ""
echo "Starting Redis service..."
brew services start redis 2>/dev/null || true
sleep 1
if redis-cli ping &>/dev/null; then
    print_status "Redis service is running"
else
    print_warning "Redis may need a moment to start"
fi

# Install FFmpeg
echo ""
echo "Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    print_status "FFmpeg is already installed"
else
    print_warning "Installing FFmpeg..."
    brew install ffmpeg
    print_status "FFmpeg installed"
fi

# Create storage directories
echo ""
echo "Creating storage directories..."
STORAGE_PATH="$HOME/englishpro-storage"
mkdir -p "$STORAGE_PATH/videos"
mkdir -p "$STORAGE_PATH/videos/hls"
mkdir -p "$STORAGE_PATH/thumbnails"
mkdir -p "$STORAGE_PATH/submissions"
mkdir -p "$STORAGE_PATH/temp"
print_status "Storage directories created at $STORAGE_PATH"

# Verify installations
echo ""
echo "=========================================="
echo "Verifying installations..."
echo "=========================================="
echo ""

echo "Node.js:    $(node -v 2>/dev/null || echo 'not found')"
echo "npm:        $(npm -v 2>/dev/null || echo 'not found')"
echo "PostgreSQL: $(psql --version 2>/dev/null || echo 'not found')"
echo "Redis:      $(redis-server --version 2>/dev/null | head -n 1 || echo 'not found')"
echo "FFmpeg:     $(ffmpeg -version 2>/dev/null | head -n 1 || echo 'not found')"

echo ""
echo "=========================================="
print_status "Mac environment setup complete!"
echo "=========================================="
echo ""
echo "Next: Run ./scripts/02-init-project.sh"
