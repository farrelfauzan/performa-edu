import { PrismaClient } from '@prisma/client';
import { AclAction, AclSubject } from '../constant/acl';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

interface Permission {
  action: string;
  subject: string;
  condition?: Record<string, any>;
  [key: string]: any;
}

function createPermission(
  subject: AclSubject,
  action: AclAction,
  condition?: Record<string, any>
): Permission {
  const permission: Permission = {
    action,
    subject,
  };
  if (condition) {
    permission.condition = condition;
  }
  return permission;
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
        // Customer management
        createPermission(AclSubject.CUSTOMER, AclAction.CREATE),
        createPermission(AclSubject.CUSTOMER, AclAction.READ),
        createPermission(AclSubject.CUSTOMER, AclAction.UPDATE),
        createPermission(AclSubject.CUSTOMER, AclAction.DELETE),
        createPermission(AclSubject.CUSTOMER, AclAction.VIEW),
      ],
    },
    {
      name: 'CUSTOMER',
      permissions: [
        // Self management
        createPermission(AclSubject.USER, AclAction.READ),
        createPermission(AclSubject.USER, AclAction.VIEW),
        createPermission(AclSubject.USER, AclAction.UPDATE, { id: '{{ id }}' }),
        // Access customer resources
        createPermission(AclSubject.CUSTOMER, AclAction.READ),
        createPermission(AclSubject.CUSTOMER, AclAction.VIEW),
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
