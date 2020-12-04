import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcryptjs';

import prisma from '../database';
import authConfig from '../config/auth';

export default class SessionsController {
  async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return response
        .status(400)
        .json({ message: 'Wrong email/password combination' });
    }

    const passwordsMatched = await compare(password, user.password);

    if (!passwordsMatched) {
      return response
        .status(400)
        .json({ message: 'Wrong email/password combination' });
    }

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign({}, secret, { subject: String(user.id), expiresIn });

    const { id, name, image } = user;

    return response.json({
      user: {
        id,
        name,
        email,
        image_url: image ? `${process.env.APP_API_URL}/files/${image}` : null,
      },
      token,
    });
  }
}
