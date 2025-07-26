import { DocumentRepository } from './document.repository.js';
import fs from 'fs';
import path from 'path';


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