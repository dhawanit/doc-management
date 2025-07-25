import bcrypt from 'bcrypt';
import { UserRepository } from '../user/user.repository.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateSessionToken,
} from './auth.utils.js';

export async function registerUser({ name, email, password }) {
  const existingUser = await UserRepository.findOneBy({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashed = await bcrypt.hash(password, 10);
  const sessionToken = generateSessionToken();

  const user = UserRepository.create({
    name,
    email,
    password: hashed,
    sessionToken,
    lastActiveAt: new Date(),
  });

  await UserRepository.save(user);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
}

export async function loginUser({ email, password }) {
  const user = await UserRepository.findOneBy({ email });
  if (!user) throw new Error('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid credentials');

  const sessionToken = generateSessionToken();
  user.sessionToken = sessionToken;
  user.lastActiveAt = new Date();
  await UserRepository.save(user);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
}
