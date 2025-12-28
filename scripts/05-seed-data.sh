#!/bin/bash
set -e

echo "=========================================="
echo "EnglishPro - Create Sample Data"
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

cd "$PROJECT_ROOT/backend"

# Create seed file
echo ""
echo "Creating seed file..."
mkdir -p prisma

cat > prisma/seed.ts << 'EOF'
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@englishpro.com' },
    update: {},
    create: {
      email: 'teacher@englishpro.com',
      passwordHash: teacherPassword,
      name: 'Demo Teacher',
      role: Role.TEACHER,
    },
  });
  console.log('Created teacher:', teacher.email);

  // Create students
  const studentPassword = await bcrypt.hash('student123', 10);

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@englishpro.com' },
    update: {},
    create: {
      email: 'student1@englishpro.com',
      passwordHash: studentPassword,
      name: 'Alice Student',
      role: Role.STUDENT,
    },
  });
  console.log('Created student:', student1.email);

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@englishpro.com' },
    update: {},
    create: {
      email: 'student2@englishpro.com',
      passwordHash: studentPassword,
      name: 'Bob Student',
      role: Role.STUDENT,
    },
  });
  console.log('Created student:', student2.email);

  // Create courses
  const course1 = await prisma.course.upsert({
    where: { id: 'course-beginner-english' },
    update: {},
    create: {
      id: 'course-beginner-english',
      teacherId: teacher.id,
      title: 'Beginner English',
      description: 'Learn the basics of English language including greetings, numbers, and common phrases.',
    },
  });
  console.log('Created course:', course1.title);

  const course2 = await prisma.course.upsert({
    where: { id: 'course-business-english' },
    update: {},
    create: {
      id: 'course-business-english',
      teacherId: teacher.id,
      title: 'Business English',
      description: 'English for professional environments including meetings, presentations, and email communication.',
    },
  });
  console.log('Created course:', course2.title);

  const course3 = await prisma.course.upsert({
    where: { id: 'course-conversation-practice' },
    update: {},
    create: {
      id: 'course-conversation-practice',
      teacherId: teacher.id,
      title: 'Conversation Practice',
      description: 'Improve your speaking skills through interactive conversation exercises.',
    },
  });
  console.log('Created course:', course3.title);

  console.log('');
  console.log('=== Sample Login Credentials ===');
  console.log('Teacher: teacher@englishpro.com / teacher123');
  console.log('Student: student1@englishpro.com / student123');
  console.log('Student: student2@englishpro.com / student123');
  console.log('');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

print_status "Seed file created"

# Update package.json to include seed script
echo ""
echo "Updating package.json with seed configuration..."

# Use node to update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.prisma = { seed: 'tsx prisma/seed.ts' };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

print_status "package.json updated with seed configuration"

# Run seed
echo ""
echo "Running database seed..."
npx prisma db seed

print_status "Database seeded successfully"

echo ""
echo "=========================================="
print_status "Sample data created!"
echo "=========================================="
echo ""
echo "Sample courses:"
echo "  - Beginner English"
echo "  - Business English"
echo "  - Conversation Practice"
echo ""
echo "Login credentials saved to: .credentials"
echo "(This file is excluded from git)"
echo ""
echo "Next: Run ./scripts/06-start-dev.sh"
