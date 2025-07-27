import { Router } from 'express';
import { 
    uploadDocument,
    listDocuments,
    downloadDocument,
    deleteDocument,
    searchDocuments,
    addTagsToDocument,
    filterDocumentsByTags,
    uploadNewVersion,
    listDocumentVersions,
    downloadDocumentVersion,
    deleteDocumentVersion
} from './document.controller.js';
import { upload } from '../../config/multer.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// Must be logged in to upload
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.get('/', authMiddleware, listDocuments);
router.get('/:id/download', authMiddleware, downloadDocument);
router.delete('/:id', authMiddleware, deleteDocument);
router.get('/search', authMiddleware, searchDocuments);
router.post('/:id/tags', authMiddleware, addTagsToDocument);
router.get('/filter/by-tags', authMiddleware, filterDocumentsByTags);
router.post('/:id/version', authMiddleware, upload.single('file'), uploadNewVersion);
router.get('/:id/versions', authMiddleware, listDocumentVersions);
router.get('/:id/versions/:versionNumber/download', authMiddleware, downloadDocumentVersion);
router.delete('/:id/versions/:versionNumber', authMiddleware, deleteDocumentVersion);


export default router;
