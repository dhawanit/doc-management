// src/modules/user/user.entity.js
import { EntitySchema } from 'typeorm';

export const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    name: {
      type: 'varchar',
    },
    email: {
      type: 'varchar',
      unique: true,
    },
    password: {
      type: 'varchar',
    },
    role: {
      type: 'enum',
      enum: ['user', 'admin'],
      default: 'user',
    },
    sessionToken: {
      type: 'varchar',
      nullable: true,
    },
    lastActiveAt: {
      type: 'timestamp',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
});