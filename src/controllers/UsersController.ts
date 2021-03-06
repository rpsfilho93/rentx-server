import { Request, Response } from 'express';
import { hash } from 'bcryptjs';

import prisma from '../database';

export default class UserController {
  async create(request: Request, response: Response): Promise<Response> {
    const { name, email, password } = request.body;

    const checkEmail = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (checkEmail) {
      return response.status(400).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await hash(password, 8);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        admin: false,
      },
    });

    return response.status(201).send();
  }
}
