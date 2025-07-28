import { EntitySchema } from 'typeorm';

export const AuditLog = new EntitySchema({
  name: 'AuditLog',
  tableName: 'audit_logs',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    action: {
      type: 'varchar',
    },
    details: {
      type: 'text',
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
