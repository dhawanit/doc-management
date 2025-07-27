import { EntitySchema } from 'typeorm';

export const DocumentVersion = new EntitySchema({
  name: 'DocumentVersion',
  tableName: 'document_versions',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    versionNumber: {
      type: 'int',
    },
    filePath: {
      type: 'varchar',
    },
    mimeType: {
      type: 'varchar',
    },
    uploadedAt: {
      type: 'timestamp',
      createDate: true,
    }
  },
  relations: {
    document: {
      type: 'many-to-one',
      target: 'Document',
      joinColumn: true,
      onDelete: 'CASCADE',
    },
    uploadedBy: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: true,
      eager: true,
    }
  }
});