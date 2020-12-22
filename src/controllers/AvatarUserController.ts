import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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

    if (user.image) {
      const filePath = path.resolve(uploadConfig.uploadsFolder, user.image);

      try {
        await fs.promises.stat(filePath);
      } catch {
        return response
          .status(500)
          .json({ message: 'Could not find this file.' });
      }

      await fs.promises.unlink(filePath);
    }

    await fs.promises.rename(
      path.resolve(uploadConfig.tmpFolder, filename),
      path.resolve(uploadConfig.uploadsFolder, filename)
    );

    const updated = await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        image: filename,
      },
    });

    return response.json({
      ...updated,
      image_url: updated.image
        ? `http://192.168.25.234:3333/files/${updated.image}`
        : null,
    });
  }
}
