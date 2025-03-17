import connectionRequest from '../models/connectionRequest.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user._id;

    if (senderId.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot send a connection request to yourself' });
    }

    if (req.user.connections.includes(userId)) {
      return res.status(400).json({ message: 'You are already connected with this user' });
    }

    const existingRequest = await connectionRequest.findOne({
      sender: senderId,
      recipient: userId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    const newRequest = new connectionRequest({
      sender: senderId,
      recipient: userId,
    });

    await newRequest.save();
    res.status(200).json({ message: 'Connection request sent' });
  } catch (error) {
    console.log('Error in sendConnectionRequest: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await connectionRequest
      .findById(requestId)
      .populate('sender', 'name email username')
      .populate('recipient', 'name username');

    if (!request) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (request.recipient._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    //console.log(request, requestId);
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request already processed' });
    }

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(request.sender._id, {
      $addToSet: { connections: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { connections: request.sender._id },
    });

    const notification = new Notification({
      recipient: request.sender._id,
      type: 'connectionAccepted',
      relatedUser: userId,
    });

    await notification.save();
    res.json({ message: 'Connection request accepted' });

    const senderEmail = request.sender.email;
    const senderName = request.sender.name;
    const recipientName = request.recipient.name;
    const profileUrl = process.env.CLIENT_URL + `/profile/${request.recipient.username}`;

    try {
      await sendConnectionAcceptedEmail(senderEmail, senderName, recipientName, profileUrl);
    } catch (error) {
      console.log('Error in sendConnectionAcceptedEmail Lib: ', error.message);
    }
  } catch (error) {
    console.log('Error in acceptConnectionRequest: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const rejectConnectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await connectionRequest.findById(requestId);

    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request already processed' });
    }

    request.status = 'rejected';
    await request.save();
    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.log('Error in rejectConnectionRequest: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getConnectionRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const requests = await connectionRequest
      .find({ recipient: userId, status: 'pending' })
      .populate('sender', 'name username profilePicture headline connections');

    res.json(requests);
  } catch (error) {
    console.log('Error in getConnectionRequests: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getUserConnections = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate(
      'connections',
      'name username profilePicture headline connections'
    );

    res.json(user.connections);
  } catch (error) {
    console.log('Error in getUserConnections: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const removeConnection = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    await User.findByIdAndUpdate(myId, {
      $pull: { connections: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { connections: myId },
    });

    res.json({ message: 'Connection removed' });
  } catch (error) {
    console.log('Error in removeConnection: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getConnectionStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = req.user;
    if (currentUser.connections.includes(targetUserId)) {
      return res.json({ status: 'connected' });
    }

    const pendingRequest = await connectionRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId },
      ],
      status: 'pending',
    });

    if (pendingRequest) {
      if (pendingRequest.sender.toString() === currentUserId.toString()) {
        return res.json({ status: 'pending' });
      } else {
        return res.json({ status: 'received', requestId: pendingRequest._id });
      }
    }

    res.json({ status: 'not_connected' });
  } catch (error) {
    console.log('Error in getConnectionStatus: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
