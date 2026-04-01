import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { validateBody } from '../middleware/validate';
import { LoginSchema } from '@dentabook/shared';

const router: ReturnType<typeof Router> = Router();

function signAccessToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

router.post('/login', validateBody(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

const RefreshSchema = z.object({ refreshToken: z.string() });

router.post('/refresh', validateBody(RefreshSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };

  let payload: { userId: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== refreshToken) {
    res.status(401).json({ error: 'Refresh token reuse detected' });
    return;
  }

  const newAccessToken = signAccessToken(user.id, user.role);
  const newRefreshToken = signRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

export default router;
