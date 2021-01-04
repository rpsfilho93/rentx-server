import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import aws from 'aws-sdk';
import mime from 'mime';

import prisma from '../database';
import uploadConfig from '../config/upload';

export default class AvatarUserController {
  async update(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { filename } = request.file;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      return response.status(400).json({ message: 'User not found.' });
    }

    const client = new aws.S3({
      region: 'us-east-2',
    });

    if (user.image) {
      await client
        .deleteObject({
          Bucket: 'rentx',
          Key: user.image,
        })
        .promise();
    }

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

    const updatedUser = await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        image: filename,
      },
    });

    return response.json({
      ...updatedUser,
      avatar_url: updatedUser.image
        ? `${process.env.AWS_URL}/${updatedUser.image}`
        : null,
    });
  }
}
