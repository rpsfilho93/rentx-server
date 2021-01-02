import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const main = async () => {
  const hashedPassword = await hash('123123', 8);

  const firstUser = await prisma.user.create({
    data: {
      name: 'Ricardo',
      email: 'rpsfilho93@gmail.com',
      password: hashedPassword,
      admin: true,
    },
  });

  const lambo = await prisma.car.create({
    data: {
      name: 'Huracan',
      brand: 'Lamborghini',
      daily_value: 280,
      specs: {
        create: {
          name: 'Fuel',
          description: 'Gasolina',
          icon: 'gas',
        },
      },
    },
  });

  const audi = await prisma.car.create({
    data: {
      name: 'RS 5 Coupé',
      brand: 'Audi',
      daily_value: 150,
      specs: {
        create: {
          name: 'Fuel',
          description: 'Elétrico',
          icon: 'eletric',
        },
      },
    },
  });

  const corvette = await prisma.car.create({
    data: {
      name: 'Corvette',
      brand: 'Chevrolet',
      daily_value: 400,
      specs: {
        create: {
          name: 'Fuel',
          description: 'Gasolina',
          icon: 'gas',
        },
      },
    },
  });

  const volvo = await prisma.car.create({
    data: {
      name: 'XC40',
      brand: 'Volvo',
      daily_value: 300,
      specs: {
        create: {
          name: 'Fuel',
          description: 'Álcool',
          icon: 'bio',
        },
      },
    },
  });

  const lancer = await prisma.car.create({
    data: {
      name: 'Lancer Evo X',
      brand: 'Mitsubishi',
      daily_value: 250,
      specs: {
        create: {
          name: 'Fuel',
          description: 'Gasolina',
          icon: 'gas',
        },
      },
    },
  });

  const porsche = await prisma.car.create({
    data: {
      name: 'Panamera',
      brand: 'Porsche',
      daily_value: 350,
      specs: {
        create: {
          name: 'Fuel',
          description: 'Elétrico',
          icon: 'eletric',
        },
      },
    },
  });
};

main().finally(async () => {
  await prisma.$disconnect();
});
