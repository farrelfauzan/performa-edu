import { PrismaClient } from '@prisma/client';
import { AclAction, AclSubject } from '../constant/acl';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

function createPermission(subject: AclSubject, action: AclAction): string {
  return `${subject}:${action}`;
}

async function seedRoles() {
  console.log('🌱 Seeding roles...');

  const roles = [
    {
      name: 'SUPER_ADMIN',
      permissions: [
        // All permissions - manage everything
        createPermission(AclSubject.ALL, AclAction.MANAGE),
      ],
    },
    {
      name: 'ADMIN',
      permissions: [
        // User management
        createPermission(AclSubject.USER, AclAction.READ),
        createPermission(AclSubject.USER, AclAction.VIEW),
        // Student management
        createPermission(AclSubject.STUDENT, AclAction.CREATE),
        createPermission(AclSubject.STUDENT, AclAction.READ),
        createPermission(AclSubject.STUDENT, AclAction.UPDATE),
        createPermission(AclSubject.STUDENT, AclAction.DELETE),
        createPermission(AclSubject.STUDENT, AclAction.VIEW),
        // Teacher management
        createPermission(AclSubject.TEACHER, AclAction.CREATE),
        createPermission(AclSubject.TEACHER, AclAction.READ),
        createPermission(AclSubject.TEACHER, AclAction.UPDATE),
        createPermission(AclSubject.TEACHER, AclAction.DELETE),
        createPermission(AclSubject.TEACHER, AclAction.VIEW),
        // Academic management
        createPermission(AclSubject.ACADEMIC_YEAR, AclAction.MANAGE),
        createPermission(AclSubject.CLASS, AclAction.MANAGE),
        createPermission(AclSubject.SUBJECTS, AclAction.MANAGE),
        // Reports
        createPermission(AclSubject.REPORT, AclAction.READ),
        createPermission(AclSubject.REPORT, AclAction.VIEW),
      ],
    },
    {
      name: 'TEACHER',
      permissions: [
        // Student view only
        createPermission(AclSubject.STUDENT, AclAction.READ),
        createPermission(AclSubject.STUDENT, AclAction.VIEW),
        // Class management
        createPermission(AclSubject.CLASS, AclAction.READ),
        createPermission(AclSubject.CLASS, AclAction.VIEW),
        createPermission(AclSubject.CLASS, AclAction.UPDATE),
        // Subject management
        createPermission(AclSubject.SUBJECTS, AclAction.READ),
        createPermission(AclSubject.SUBJECTS, AclAction.VIEW),
        createPermission(AclSubject.SUBJECTS, AclAction.UPDATE),
        // Assignment management
        createPermission(AclSubject.ASSIGNMENT, AclAction.CREATE),
        createPermission(AclSubject.ASSIGNMENT, AclAction.READ),
        createPermission(AclSubject.ASSIGNMENT, AclAction.UPDATE),
        createPermission(AclSubject.ASSIGNMENT, AclAction.DELETE),
        createPermission(AclSubject.ASSIGNMENT, AclAction.VIEW),
        // Grade management
        createPermission(AclSubject.GRADE, AclAction.CREATE),
        createPermission(AclSubject.GRADE, AclAction.READ),
        createPermission(AclSubject.GRADE, AclAction.UPDATE),
        createPermission(AclSubject.GRADE, AclAction.VIEW),
        // Exam management
        createPermission(AclSubject.EXAM, AclAction.CREATE),
        createPermission(AclSubject.EXAM, AclAction.READ),
        createPermission(AclSubject.EXAM, AclAction.UPDATE),
        createPermission(AclSubject.EXAM, AclAction.DELETE),
        createPermission(AclSubject.EXAM, AclAction.VIEW),
        // Attendance
        createPermission(AclSubject.ATTENDANCE, AclAction.CREATE),
        createPermission(AclSubject.ATTENDANCE, AclAction.READ),
        createPermission(AclSubject.ATTENDANCE, AclAction.UPDATE),
        createPermission(AclSubject.ATTENDANCE, AclAction.VIEW),
        // Reports
        createPermission(AclSubject.REPORT, AclAction.READ),
        createPermission(AclSubject.REPORT, AclAction.VIEW),
      ],
    },
    {
      name: 'STUDENT',
      permissions: [
        // View own information
        createPermission(AclSubject.USER, AclAction.READ),
        createPermission(AclSubject.USER, AclAction.VIEW),
        // View class information
        createPermission(AclSubject.CLASS, AclAction.READ),
        createPermission(AclSubject.CLASS, AclAction.VIEW),
        // View subjects
        createPermission(AclSubject.SUBJECTS, AclAction.READ),
        createPermission(AclSubject.SUBJECTS, AclAction.VIEW),
        // View assignments
        createPermission(AclSubject.ASSIGNMENT, AclAction.READ),
        createPermission(AclSubject.ASSIGNMENT, AclAction.VIEW),
        // View grades
        createPermission(AclSubject.GRADE, AclAction.READ),
        createPermission(AclSubject.GRADE, AclAction.VIEW),
        // View exams
        createPermission(AclSubject.EXAM, AclAction.READ),
        createPermission(AclSubject.EXAM, AclAction.VIEW),
        // View attendance
        createPermission(AclSubject.ATTENDANCE, AclAction.READ),
        createPermission(AclSubject.ATTENDANCE, AclAction.VIEW),
      ],
    },
  ];

  for (const roleData of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: roleData,
      });
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      // Update permissions if role exists
      await prisma.role.update({
        where: { name: roleData.name },
        data: { permissions: roleData.permissions },
      });
      console.log(`🔄 Updated role: ${roleData.name}`);
    }
  }

  console.log('✅ Roles seeding completed!');
}

async function main() {
  await seedRoles();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
