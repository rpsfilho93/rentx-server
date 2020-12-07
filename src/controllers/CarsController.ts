import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';
import prisma from '../database';
import AppError from '../errors/AppError';

export default class CarsController {
  async create(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { filename } = request.file;
    const { name, brand, daily_value } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

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

    const car = await prisma.car.create({
      data: {
        name,
        brand,
        daily_value: Number(daily_value),
        image: filename,
      },
    });

    return response.status(200).json(car);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { car_id } = request.query;
    const { name, brand, daily_value } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      // throw new AppError('User not found');
      return response.status(404).json({ message: 'User not found.' });
    }

    if (!user.admin) {
      // throw new AppError('You do not have admin authority', 401)
      return response
        .status(401)
        .json({ message: 'You do not have admin authority' });
    }

    const car = await prisma.car.findFirst({ where: { id: String(car_id) } });

    if (!car) {
      return response.status(404).json({ message: 'Car not found.' });
    }

    const updatedCar = await prisma.car.update({
      where: {
        id: String(car_id),
      },
      data: {
        name,
        brand,
        daily_value,
      },
    });

    return response.status(200).json(updatedCar);
  }

  async index(request: Request, response: Response): Promise<Response> {
    const { name } = request.query;

    const cars = await prisma.car.findMany({
      where: {
        name: {
          contains: String(name),
          mode: 'insensitive',
        },
      },
    });

    return response.status(200).json(cars);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { car_id } = request.query;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      // throw new AppError('User not found');
      return response.status(404).json({ message: 'User not found.' });
    }

    if (!user.admin) {
      // throw new AppError('You do not have admin authority', 401)
      return response
        .status(401)
        .json({ message: 'You do not have admin authority' });
    }

    const car = await prisma.car.findFirst({ where: { id: String(car_id) } });

    if (!car) {
      return response.status(404).json({ message: 'Car not found.' });
    }

    await prisma.car.delete({
      where: {
        id: String(car_id),
      },
    });

    return response.status(204).send();
  }
}
