// src/modules/user/user.repository.js
import { AppDataSource } from '../../config/data-source.js';
import { User } from './user.entity.js';

export const UserRepository = AppDataSource.getRepository('User');
