#!/bin/bash
set -e

echo "=========================================="
echo "EnglishPro - Environment Setup"
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
STORAGE_PATH="$HOME/englishpro-storage"

# Generate random secrets
generate_secret() {
    openssl rand -base64 32 | tr -d '/=+' | cut -c -32
}

echo ""
echo "Generating secure secrets..."
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
print_status "JWT secrets generated"

# Detect FFmpeg path
echo ""
echo "Detecting FFmpeg path..."
if [[ $(uname -m) == "arm64" ]]; then
    FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"
else
    FFMPEG_PATH="/usr/local/bin/ffmpeg"
fi

if [ -f "$FFMPEG_PATH" ]; then
    print_status "FFmpeg found at $FFMPEG_PATH"
else
    # Try to find it
    FFMPEG_PATH=$(which ffmpeg 2>/dev/null || echo "/opt/homebrew/bin/ffmpeg")
    print_warning "Using FFmpeg path: $FFMPEG_PATH"
fi

# Get current username for PostgreSQL
CURRENT_USER=$(whoami)

# Create backend .env
echo ""
echo "Creating backend .env..."
cat > "$PROJECT_ROOT/backend/.env" << EOF
# Database
DATABASE_URL="postgresql://${CURRENT_USER}@localhost:5432/englishpro_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (auto-generated - keep secure!)
JWT_SECRET="$JWT_SECRET"
JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=8000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Storage Paths
STORAGE_PATH="$STORAGE_PATH"
VIDEOS_PATH="$STORAGE_PATH/videos"
THUMBNAILS_PATH="$STORAGE_PATH/thumbnails"
SUBMISSIONS_PATH="$STORAGE_PATH/submissions"
TEMP_PATH="$STORAGE_PATH/temp"

# FFmpeg
FFMPEG_PATH="$FFMPEG_PATH"

# Upload Limits
MAX_VIDEO_SIZE_MB=500
MAX_SUBMISSION_SIZE_MB=100
EOF

print_status "Backend .env created"

# Create frontend .env
echo ""
echo "Creating frontend .env..."
cat > "$PROJECT_ROOT/frontend/.env" << EOF
VITE_API_URL="http://localhost:8000/api"
VITE_APP_NAME="EnglishPro"
EOF

print_status "Frontend .env created"

# Create .env.example files for version control
echo ""
echo "Creating .env.example files..."

cat > "$PROJECT_ROOT/backend/.env.example" << 'EOF'
# Database
DATABASE_URL="postgresql://localhost:5432/englishpro_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate your own!)
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=8000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Storage Paths
STORAGE_PATH="/Users/YOUR_USERNAME/englishpro-storage"
VIDEOS_PATH="${STORAGE_PATH}/videos"
THUMBNAILS_PATH="${STORAGE_PATH}/thumbnails"
SUBMISSIONS_PATH="${STORAGE_PATH}/submissions"
TEMP_PATH="${STORAGE_PATH}/temp"

# FFmpeg
FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"

# Upload Limits
MAX_VIDEO_SIZE_MB=500
MAX_SUBMISSION_SIZE_MB=100
EOF

cat > "$PROJECT_ROOT/frontend/.env.example" << 'EOF'
VITE_API_URL="http://localhost:8000/api"
VITE_APP_NAME="EnglishPro"
EOF

print_status ".env.example files created"

# Update .gitignore to ensure .env files are not committed
echo ""
echo "Updating .gitignore..."
GITIGNORE="$PROJECT_ROOT/.gitignore"
if [ -f "$GITIGNORE" ]; then
    if ! grep -q "^\.env$" "$GITIGNORE"; then
        echo "" >> "$GITIGNORE"
        echo "# Environment files" >> "$GITIGNORE"
        echo ".env" >> "$GITIGNORE"
        echo ".env.local" >> "$GITIGNORE"
        echo ".env.*.local" >> "$GITIGNORE"
    fi
fi
print_status ".gitignore updated"

echo ""
echo "=========================================="
print_status "Environment setup complete!"
echo "=========================================="
echo ""
echo "Configuration files created:"
echo "  - backend/.env (with auto-generated secrets)"
echo "  - frontend/.env"
echo "  - backend/.env.example"
echo "  - frontend/.env.example"
echo ""
echo "Storage location: $STORAGE_PATH"
echo ""
echo "Next: Run ./scripts/05-seed-data.sh"
