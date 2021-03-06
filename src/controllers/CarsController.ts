import { Request, Response } from 'express';
import { parseISO, parse } from 'date-fns';

import prisma from '../database';
import AppError from '../errors/AppError';

export default class CarsController {
  async create(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
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

    const car = await prisma.car.create({
      data: {
        name,
        brand,
        daily_value: Number(daily_value),
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
    const {
      name,
      start_date,
      end_date,
      start_price,
      end_price,
      fuel,
      transmission,
    } = request.query;

    if (name) {
      const cars = await prisma.car.findMany({
        where: {
          name: {
            contains: String(name),
            mode: 'insensitive',
          },
        },
        include: {
          specs: {
            select: {
              name: true,
              description: true,
              icon: true,
            },
          },
          CarImage: {
            select: {
              name: true,
            },
          },
        },
      });

      const carsWithURL = cars.map((car) => {
        const car_images = car.CarImage.map((image) => ({
          ...image,
          image_url: image.name ? `${process.env.AWS_URL}/${image.name}` : null,
        }));

        return {
          ...car,
          CarImage: car_images,
        };
      });

      return response.status(200).json(carsWithURL);
    }

    if (start_date && end_date) {
      const startDate = parseISO(String(start_date));
      const endDate = parseISO(String(end_date));

      const cars = await prisma.car.findMany({
        where: {
          Rental: {
            none: {
              start_date: {
                lte: endDate,
              },
              end_date: {
                gte: startDate,
              },
            },
          },
        },
        include: {
          specs: {
            select: {
              name: true,
              description: true,
              icon: true,
            },
          },
          CarImage: {
            select: {
              name: true,
            },
          },
        },
      });

      const carsWithURL = cars.map((car) => {
        const car_images = car.CarImage.map((image) => ({
          ...image,
          image_url: image.name ? `${process.env.AWS_URL}/${image.name}` : null,
        }));

        return {
          ...car,
          CarImage: car_images,
        };
      });

      return response.status(200).json(carsWithURL);
    }

    if (start_price && end_price && fuel && transmission) {
      const startPrice = Number(start_price);
      const endPrice = Number(end_price);

      if (startPrice > endPrice) {
        return response
          .status(400)
          .json({ message: 'Start price must be smaller than end price.' });
      }

      const cars = await prisma.car.findMany({
        where: {
          AND: [
            {
              daily_value: {
                gte: startPrice,
                lte: endPrice,
              },
            },
            {
              specs: {
                every: {
                  OR: [
                    {
                      AND: [
                        {
                          name: 'Fuel',
                        },
                        {
                          description: String(fuel),
                        },
                      ],
                    },
                    {
                      AND: [
                        {
                          name: 'Transmission',
                        },
                        {
                          description: String(transmission),
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
        include: {
          specs: {
            select: {
              name: true,
              description: true,
              icon: true,
            },
          },
          CarImage: {
            select: {
              name: true,
            },
          },
        },
      });

      const carsWithURL = cars.map((car) => {
        const car_images = car.CarImage.map((image) => ({
          ...image,
          image_url: image.name ? `${process.env.AWS_URL}/${image.name}` : null,
        }));

        return {
          ...car,
          CarImage: car_images,
        };
      });

      return response.status(200).json(carsWithURL);
    }

    const cars = await prisma.car.findMany({
      include: {
        specs: {
          select: {
            name: true,
            description: true,
            icon: true,
          },
        },
        CarImage: {
          select: {
            name: true,
          },
        },
      },
    });

    const carsWithURL = cars.map((car) => {
      const car_images = car.CarImage.map((image) => ({
        ...image,
        image_url: image.name ? `${process.env.AWS_URL}/${image.name}` : null,
      }));

      return {
        ...car,
        CarImage: car_images,
      };
    });

    return response.status(200).json(carsWithURL);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const car_id = request.params.id;

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
