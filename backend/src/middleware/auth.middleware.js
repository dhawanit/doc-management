import jwt from 'jsonwebtoken';
import { UserRepository } from '../modules/user/user.repository.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log(authHeader);
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserRepository.findOneBy({ id: payload.id });
    console.log(user);

    if (!user || user.sessionToken !== payload.sessionToken) {
      return res.status(403).json({ message: 'Session invalidated' });
    }

    const TEN_MINUTES = 10 * 60 * 1000;
    const lastSeen = new Date(user.lastActiveAt || 0).getTime();

    if (Date.now() - lastSeen > TEN_MINUTES) {
      user.sessionToken = null;
      await UserRepository.save(user);
      return res.status(401).json({ message: 'Session expired due to inactivity' });
    }

    user.lastActiveAt = new Date();
    await UserRepository.save(user);

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

