import { EntitySchema } from 'typeorm';

export const Notification = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    message: {
      type: 'text',
    },
    isRead: {
      type: 'boolean',
      default: false,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      eager: true
    }
  }
});
