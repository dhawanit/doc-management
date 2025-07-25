import jwt from 'jsonwebtoken';
import { UserRepository } from '../user/user.repository.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from './auth.utils.js';
import { registerUser, loginUser } from './auth.service.js';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const { accessToken, refreshToken, user } = await registerUser({ name, email, password });

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ token: accessToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await loginUser({ email, password });

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ token: accessToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}


export async function refresh(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserRepository.findOneBy({ id: payload.id });

    if (!user || user.sessionToken !== payload.sessionToken) {
      return res.status(403).json({ message: 'Invalid session' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ token: accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(req, res) {
  try {
    const user = req.user;
    user.sessionToken = null;
    await UserRepository.save(user);

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
}

export function me(req, res) {
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } });
}
