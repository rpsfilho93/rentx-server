import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';
import prisma from '../database';

export default class CarImagesController {
  async store(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const car_id = request.params.id;
    const { filename } = request.file;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    const car = await prisma.car.findFirst({
      where: {
        id: car_id,
      },
    });

    if (!car) {
      // throw new AppError('Car not found');
      return response.status(400).json({ message: 'Car not found.' });
    }

    if (!user) {
      // throw new AppError('User not found');
      return response.status(400).json({ message: 'User not found.' });
    }

    if (!user.admin) {
      // throw new AppError('You do not have admin authority', 401)
      return response
        .status(401)
        .json({ message: 'You do not have admin authority' });
    }

    await fs.promises.rename(
      path.resolve(uploadConfig.tmpFolder, filename),
      path.resolve(uploadConfig.uploadsFolder, filename)
    );

    await prisma.carImage.create({
      data: {
        name: filename,
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
