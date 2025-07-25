import { AppDataSource } from '../../config/data-source.js';
import { Document } from './document.entity.js';

export const DocumentRepository = AppDataSource.getRepository(Document);