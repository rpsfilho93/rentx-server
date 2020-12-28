import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcryptjs';

import prisma from '../database';
import authConfig from '../config/auth';

export default class SessionsController {
  async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return response
        .status(400)
        .json({ message: 'Wrong email/password combination' });
    }

    const passwordsMatched = await compare(password, user.password);

    if (!passwordsMatched) {
      return response
        .status(400)
        .json({ message: 'Wrong email/password combination' });
    }

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({}, secret, { subject: String(user.id), expiresIn });

    const { id, name, image } = user;

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
          image_url: image ? `${process.env.APP_API_URL}/files/${image}` : null,
        },
        token,
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
        image_url: image ? `${process.env.APP_API_URL}/files/${image}` : null,
        rentals: numberOfRentals,
        favoriteCar: favoriteCar
          ? {
            name: favoriteCar.name,
            brand: favoriteCar.brand,
            daily_value: favoriteCar.daily_value,
            fuel: favoriteCar.specs[0].icon,
            image_url: `${process.env.APP_API_URL}/files/${favoriteCar.CarImage[0].name}`,
            occurrences: carsOrderByOccurrences[0].count,
          }
          : null,
      },
      token,
    });
  }
}
