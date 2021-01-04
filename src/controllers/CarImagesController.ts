import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import aws from 'aws-sdk';
import mime from 'mime';

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

    const client = new aws.S3({
      region: 'us-east-2',
    });

    const originalPath = path.resolve(uploadConfig.tmpFolder, filename);

    const ContentType = mime.getType(originalPath);

    if (!ContentType) {
      throw new Error('File not found.');
    }

    const fileContent = await fs.promises.readFile(originalPath);

    await client
      .putObject({
        Bucket: 'rentx',
        Key: filename,
        ACL: 'public-read',
        Body: fileContent,
        ContentType,
      })
      .promise();

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
