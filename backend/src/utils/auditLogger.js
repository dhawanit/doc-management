import { AppDataSource } from '../config/data-source.js';
import { AuditLog } from '../modules/audit/auditLog.entity.js';

const auditRepo = AppDataSource.getRepository(AuditLog);

export async function logAction(user, action, details) {
  try {
    const log = auditRepo.create({
      user,
      action,
      details: JSON.stringify(details)
    });
    await auditRepo.save(log);
  } catch (err) {
    console.error('[Audit Logger] Error:', err);
  }
}
