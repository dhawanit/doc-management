import { EntitySchema } from 'typeorm';
import { User } from '../user/user.entity.js';

export const Document = new EntitySchema({
  name: 'Document',
  tableName: 'documents',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    title: {
      type: 'varchar',
    },
    description: {
      type: 'text',
      nullable: true,
    },
    filePath: {
      type: 'varchar',
    },
    mimeType: {
      type: 'varchar',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    uploadedBy: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: true,
      eager: true,
    },
    tags: {
      type: 'many-to-many',
      target: 'Tag',
      joinTable: true,
      cascade: true,
      eager: true
    },
    versions: {
      type: 'one-to-many',
      target: 'DocumentVersion',
      inverseSide: 'document',
      cascade: true
    }
  }  
});