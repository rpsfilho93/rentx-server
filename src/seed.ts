import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const main = async () => {
  const hashedPassword = await hash('123123', 8);

  await prisma.user.create({
    data: {
      name: 'Ricardo',
      email: 'rpsfilho93@gmail.com',
      password: hashedPassword,
      admin: true,
    },
  });
};

main().finally(async () => {
  await prisma.$disconnect();
});
