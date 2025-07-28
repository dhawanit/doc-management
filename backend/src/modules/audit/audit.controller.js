import { AppDataSource } from '../../config/data-source.js';
import { AuditLog } from './auditLog.entity.js';

export const listAuditLogs = async (req, res) => {
  try {
    const logs = await AppDataSource.getRepository(AuditLog).find({
      order: { createdAt: 'DESC' },
      take: 50
    });
    res.json(logs);
  } catch (err) {
    console.error('[listAuditLogs] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
