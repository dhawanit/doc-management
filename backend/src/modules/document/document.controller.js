import { DocumentRepository } from './document.repository.js';
import { Tag } from '../tag/tag.entity.js';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../../config/data-source.js';
import { Document } from './document.entity.js';
import { DocumentVersion } from './documentVersion.entity.js';


export const uploadDocument = async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;
    console.log("Here in code");
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = req.user; // Extracted from auth middleware

    const newDoc = DocumentRepository.create({
      title,
      description,
      filePath: file.path,
      mimeType: file.mimetype,
      uploadedBy: user,
    });

    const savedDoc = await DocumentRepository.save(newDoc);

    return res.status(201).json({
      message: 'File uploaded successfully',
      document: {
        id: savedDoc.id,
        title: savedDoc.title,
        uploadedBy: savedDoc.uploadedBy.id,
        createdAt: savedDoc.createdAt,
      },
    });
  } catch (err) {
    console.error('[uploadDocument] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listDocuments = async (req, res) => {
  try {
    const user = req.user;

    let documents;

    if (user.role === 'admin') {
      // Admin sees all documents
      documents = await DocumentRepository.find({
        relations: ['uploadedBy'],
        order: { createdAt: 'DESC' }
      });
    } else {
      // Regular users see only their documents
      documents = await DocumentRepository.find({
        where: { uploadedBy: { id: user.id } },
        relations: ['uploadedBy'],
        order: { createdAt: 'DESC' }
      });
    }

    const formatted = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      uploadedBy: {
        id: doc.uploadedBy.id,
        name: doc.uploadedBy.name,
        email: doc.uploadedBy.email
      },
      createdAt: doc.createdAt
    }));

    return res.status(200).json({ documents: formatted });
  } catch (err) {
    console.error('[listDocuments] Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy']
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Authorization: Only uploader or admin
    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePath = path.resolve(doc.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    res.download(filePath, path.basename(filePath));
  } catch (err) {
    console.error('[downloadDocument] Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy']
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    // Remove file from storage
    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    // Remove DB entry
    await DocumentRepository.remove(doc);

    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('[deleteDocument] Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const searchDocuments = async (req, res) => {
  try {
    const user = req.user;
    const { title, from, to, type } = req.query;

    const query = DocumentRepository.createQueryBuilder('document')
      .leftJoinAndSelect('document.uploadedBy', 'user');

    // Role check: user sees only their docs
    if (user.role !== 'admin') {
      query.andWhere('document.uploadedBy = :userId', { userId: user.id });
    }

    if (title) {
      query.andWhere('LOWER(document.title) LIKE :title', { title: `%${title.toLowerCase()}%` });
    }

    if (from && to) {
      query.andWhere('document.createdAt BETWEEN :from AND :to', {
        from: new Date(from),
        to: new Date(to)
      });
    }

    if (type) {
      query.andWhere('document.mimeType = :type', { type });
    }

    const docs = await query.orderBy('document.createdAt', 'DESC').getMany();

    res.json({ documents: docs });
  } catch (err) {
    console.error('[searchDocuments] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const addTagsToDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body; // ["finance", "2025", "reports"]

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy', 'tags']
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const user = req.user;
    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this document' });
    }

    const tagRepo = AppDataSource.getRepository(Tag);
    const tagEntities = [];

    for (const name of tags) {
      let tag = await tagRepo.findOneBy({ name });
      if (!tag) {
        tag = tagRepo.create({ name });
        await tagRepo.save(tag);
      }
      tagEntities.push(tag);
    }

    doc.tags = [...(doc.tags || []), ...tagEntities];
    await DocumentRepository.save(doc);

    return res.json({ message: 'Tags added', tags: doc.tags });
  } catch (err) {
    console.error('[addTagsToDocument] Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const filterDocumentsByTags = async (req, res) => {
  try {
    const user = req.user;
    const { tags } = req.query; // Example: ?tags=finance,report

    if (!tags) {
      return res.status(400).json({ message: 'Tags are required' });
    }

    const tagList = tags.split(',').map((t) => t.trim().toLowerCase());

    let query = DocumentRepository.createQueryBuilder('document')
      .leftJoinAndSelect('document.tags', 'tag')
      .leftJoinAndSelect('document.uploadedBy', 'user')
      .where('LOWER(tag.name) IN (:...tagList)', { tagList });

    // User role restriction
    if (user.role !== 'admin') {
      query = query.andWhere('document.uploadedBy = :userId', { userId: user.id });
    }

    const documents = await query.getMany();

    res.json({ documents });
  } catch (err) {
    console.error('[filterDocumentsByTags] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const uploadNewVersion = async (req, res) => {
  try {
    const { id } = req.params; // Document ID
    const user = req.user;
    const file = req.file;

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy', 'versions']
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const versionRepo = AppDataSource.getRepository(DocumentVersion);
    const versionNumber = (doc?.versions?.length || 0) + 1;

    const newVersion = versionRepo.create({
      versionNumber,
      filePath: file?.path,
      mimeType: file?.mimetype,
      document: doc,
      uploadedBy: user
    });

    await versionRepo.save(newVersion);

    return res.status(201).json({
      message: 'New version uploaded',
      version: {
        versionNumber: newVersion?.versionNumber,
        uploadedAt: newVersion?.uploadedAt
      }
    });
  } catch (err) {
    console.error('[uploadNewVersion] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const listDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy', 'versions']
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      documentId: doc.id,
      versions: doc.versions.map(v => ({
        versionNumber: v.versionNumber,
        mimeType: v.mimeType,
        uploadedAt: v.uploadedAt
      }))
    });
  } catch (err) {
    console.error('[listDocumentVersions] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const downloadDocumentVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const user = req.user;

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy']
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const versionRepo = AppDataSource.getRepository(DocumentVersion);
    const version = await versionRepo.findOne({
      where: {
        document: { id: parseInt(id, 10) },
        versionNumber: parseInt(versionNumber, 10)
      }
    });

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    if (!fs.existsSync(version.filePath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    res.download(version.filePath);
  } catch (err) {
    console.error('[downloadDocumentVersion] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteDocumentVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;
    const user = req.user;

    const doc = await DocumentRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['uploadedBy']
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (user.role !== 'admin' && doc.uploadedBy.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const versionRepo = AppDataSource.getRepository(DocumentVersion);
    const version = await versionRepo.findOne({
      where: {
        document: { id: parseInt(id, 10) },
        versionNumber: parseInt(versionNumber, 10)
      }
    });

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    if (fs.existsSync(version.filePath)) {
      fs.unlinkSync(version.filePath);
    }

    await versionRepo.remove(version);

    res.json({ message: 'Version deleted successfully' });
  } catch (err) {
    console.error('[deleteDocumentVersion] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};