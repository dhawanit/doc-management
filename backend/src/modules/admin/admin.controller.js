import { UserRepository } from '../user/user.repository.js';
import { DocumentRepository } from '../document/document.repository.js';
import { createNotification } from '../notification/notification.controller.js';

export const listUsers = async (req, res) => {
  try {
    const users = await UserRepository.find();
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    })));
  } catch (err) {
    console.error('[listUsers] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await UserRepository.findOneBy({ id: parseInt(id, 10) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await UserRepository.save(user);
    await createNotification(user, `Your role has been changed to ${role} by admin.`);
    res.json({ message: 'Role updated', user: { id: user.id, role: user.role } });
  } catch (err) {
    console.error('[updateUserRole] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserRepository.findOneBy({ id: parseInt(id, 10) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await UserRepository.remove(user);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[deleteUser] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const forceLogoutUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserRepository.findOneBy({ id: parseInt(id, 10) });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.sessionToken = null;
    await UserRepository.save(user);

    res.json({ message: 'User logged out successfully' });
  } catch (err) {
    console.error('[forceLogoutUser] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const listAllDocuments = async (req, res) => {
  try {
    const docs = await DocumentRepository.find({ relations: ['uploadedBy'] });
    res.json(docs);
  } catch (err) {
    console.error('[listAllDocuments] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};