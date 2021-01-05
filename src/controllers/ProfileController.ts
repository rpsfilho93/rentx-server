import { Request, Response } from 'express';
import { hash, compare } from 'bcryptjs';
import prisma from '../database';

export default class ProfileController {
  async update(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { name, email, password, old_password } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      // throw new AppError('User not found');
      return response.status(400).json({ message: 'User not found.' });
    }

    const checkEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (checkEmail && String(checkEmail.id) !== user_id) {
      return response
        .status(400)
        .json({ message: 'This email is already been used' });
    }

    if (password) {
      if (!old_password) {
        return response.status(400).json({ message: 'Missing old password.' });
      }

      const checkOldPassword = await compare(old_password, user.password);

      if (!checkOldPassword) {
        return response.status(400).json({ message: 'Wrong password' });
      }

      user.password = await hash(password, 8);
    }

    const updated = await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        name,
        email,
        password: user.password,
      },
    });

    return response.json({
      name,
      email,
      image_url: user.image ? `${process.env.AWS_URL}/${updated.image}` : null,
    });
  }

  async show(request: Request, response: Response): Promise<Response> {
    const user = await prisma.user.findUnique({
      where: {
        id: request.user.id,
      },
    });

    if (!user) {
      return response
        .status(400)
        .json({ message: 'Wrong email/password combination' });
    }

    const { id, name, email, image } = user;

    const numberOfRentals = await prisma.rental.count({
      where: {
        client_id: id,
      },
    });

    const carsOrderByOccurrences = await prisma.$queryRaw`
      SELECT "car_id",
      COUNT(*) AS "count"
      FROM "Rental"
      WHERE "client_id" = ${id}
      GROUP BY "car_id"
      ORDER BY "count" DESC`;

    if (carsOrderByOccurrences.length === 0) {
      return response.json({
        user: {
          id,
          name,
          email,
          image_url: image ? `${process.env.AWS_URL}/${image}` : null,
        },
      });
    }

    const favoriteCar = await prisma.car.findUnique({
      where: {
        id: carsOrderByOccurrences[0].car_id,
      },
      include: {
        CarImage: true,
        specs: {
          where: {
            name: 'Fuel',
          },
          select: {
            icon: true,
          },
        },
      },
    });

    return response.json({
      user: {
        id,
        name,
        email,
        image_url: image ? `${process.env.AWS_URL}/${image}` : null,
        rentals: numberOfRentals,
        favoriteCar: favoriteCar
          ? {
            name: favoriteCar.name,
            brand: favoriteCar.brand,
            daily_value: favoriteCar.daily_value,
            fuel: favoriteCar.specs[0].icon,
            image_url: `${process.env.AWS_URL}/${favoriteCar.CarImage[0].name}`,
            occurrences: carsOrderByOccurrences[0].count,
          }
          : null,
      },
    });
  }
}
