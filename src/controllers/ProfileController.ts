import { Request, Response } from 'express';
import { hash, compare } from 'bcryptjs';
import prisma from '../database';

export default class ProfileController {
  async update(request: Request, response: Response): Promise<Response> {
    const user_id = request.user.id;
    const { name, email, password, old_password } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      // throw new AppError('User not found');
      return response.status(400).json({ message: 'User not found.' });
    }

    const checkEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (checkEmail && String(checkEmail.id) !== user_id) {
      return response
        .status(400)
        .json({ message: 'This email is already been used' });
    }

    if (password) {
      if (!old_password) {
        return response.status(400).json({ message: 'Missing old password.' });
      }

      const checkOldPassword = await compare(old_password, user.password);

      if (!checkOldPassword) {
        return response.status(400).json({ message: 'Wrong password' });
      }

      user.password = await hash(password, 8);
    }

    const updated = await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        name,
        email,
        password: user.password,
      },
    });

    return response.json({
      ...updated,
      image_url: user.image
        ? `http://192.168.25.234:3333/files/${updated.image}`
        : null,
    });
  }
}
