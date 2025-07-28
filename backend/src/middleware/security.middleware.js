import helmet from 'helmet';

// Adds secure HTTP headers
export const securityHeaders = helmet();

// Basic IP blocking
const blockedIPs = ['123.45.67.89'];

export const ipBlocker = (req, res, next) => {
  if (blockedIPs.includes(req.ip)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
