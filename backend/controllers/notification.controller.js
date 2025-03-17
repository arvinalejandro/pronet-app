import Notification from '../models/notification.model.js';

export const getUserNotification = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('relatedUser', 'name username profilePicture')
      .populate('relatedPost', 'content image');
    res.status(200).json(notifications);
  } catch (error) {
    console.log('Error in getUserNotification: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findByIdAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.log('Error in markNotificationAsRead: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteNotification = async (req, res) => {
  const notificationId = req.params.id;
  try {
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id,
    });
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.log('Error in deleteNotification: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
