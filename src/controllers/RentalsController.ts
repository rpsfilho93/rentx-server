import { isAfter, isBefore, parseISO } from 'date-fns';
import { Request, Response } from 'express';
import prisma from '../database';

export default class RentalController {
  async create(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { car_id, start_date, end_date } = request.body;

    const car = await prisma.car.findFirst({
      where: {
        id: car_id,
      },
    });

    if (!car) {
      return response.status(400).json({ message: 'Car not found.' });
    }

    const wrongOrder = isAfter(start_date, end_date);

    if (wrongOrder) {
      return response
        .status(400)
        .json({ message: 'start_date must be sooner than end_date.' });
    }

    const isInThePast = isBefore(start_date, new Date());

    if (isInThePast) {
      return response
        .status(400)
        .json({ message: 'start_date must be in the future.' });
    }

    const alreadyRented = await prisma.rental.findMany({
      where: {
        car: {
          id: String(car_id),
        },
        start_date: {
          lte: end_date,
        },
        end_date: {
          gte: start_date,
        },
      },
    });

    if (alreadyRented.length > 0) {
      return response.status(400).json({
        message: 'This car is already booked for this time range.',
      });
    }

    await prisma.rental.create({
      data: {
        car: {
          connect: {
            id: car_id,
          },
        },
        client: {
          connect: {
            id: user_id,
          },
        },
        start_date,
        end_date,
      },
    });

    return response.status(201).send();
  }

  async index(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;

    const rentals = await prisma.rental.findMany({
      where: {
        client_id: user_id,
      },
      select: {
        car: {
          select: {
            id: true,
            brand: true,
            CarImage: true,
            name: true,
            daily_value: true,
            specs: {
              where: {
                name: 'Fuel',
              },
            },
          },
        },
        start_date: true,
        end_date: true,
        id: true,
      },
      orderBy: {
        start_date: 'asc',
      },
    });

    const rentalsWithURL = rentals.map((rental) => {
      const car_images = rental.car.CarImage.map((image) => ({
        ...image,
        image_url: image.name
          ? `${process.env.AWS_URL}/${image.name}`
          : null,
      }));

      return {
        ...rental,
        car: {
          ...rental.car,
          CarImage: car_images,
        },
      };
    });

    return response.status(200).json(rentalsWithURL);
  }
}
