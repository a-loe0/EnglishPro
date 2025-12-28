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
