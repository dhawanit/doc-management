import { AppDataSource } from '../../config/data-source.js';
import { Notification } from './notification.entity.js';

const notificationRepo = AppDataSource.getRepository(Notification);

export const getUserNotifications = async (req, res) => {
  try {
    const user = req.user;
    const notifications = await notificationRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' }
    });
    res.json(notifications);
  } catch (err) {
    console.error('[getUserNotifications] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const notification = await notificationRepo.findOne({
      where: { id: parseInt(id, 10), user: { id: user.id } }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notificationRepo.save(notification);

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('[markNotificationAsRead] Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createNotification = async (user, message) => {
  try {
    const notification = notificationRepo.create({
      user,
      message
    });
    await notificationRepo.save(notification);
  } catch (err) {
    console.error('[createNotification] Error:', err);
  }
};