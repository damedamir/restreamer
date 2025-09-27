import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    });

    if (existingUser) {
      console.log('Demo user already exists');
      return;
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        password: hashedPassword,
        name: 'Demo Admin',
        role: 'ADMIN'
      }
    });

    console.log('Demo user created successfully:', {
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
