import { Request, Response } from 'express';
import prisma from '../database';

export default class SpecController {
  async create(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { car_id, name, description, icon } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user?.admin) {
      return response
        .status(401)
        .json({ message: 'You do not have admin authority.' });
    }

    const car = await prisma.car.findFirst({
      where: {
        id: String(car_id),
      },
    });

    if (!car) {
      return response.status(400).json({ message: 'Car not found.' });
    }

    await prisma.specification.create({
      data: {
        name,
        description,
        icon,
        car: {
          connect: {
            id: car_id,
          },
        },
      },
    });

    return response.status(201).send();
  }
}
