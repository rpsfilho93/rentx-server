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

    const startDate = parseISO(start_date);
    const endDate = parseISO(end_date);

    const wrongOrder = isAfter(startDate, endDate);

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
        car_id: String(car_id),
        start_date: {
          lte: endDate,
        },
        end_date: {
          gte: startDate,
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
        start_date: startDate,
        end_date: endDate,
      },
    });

    return response.status(201).send();
  }
}
