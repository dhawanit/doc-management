import { DocumentRepository } from './document.repository.js';
import { AppDataSource } from '../../config/data-source.js';
import path from 'path';
import { Document } from './document.entity.js';


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
