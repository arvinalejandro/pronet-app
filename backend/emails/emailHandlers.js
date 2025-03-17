import { mailtrapClient, sender } from '../lib/mailtrap.js';
import {
  createConnectionAcceptedEmailTemplate,
  createWelcomeEmailTemplate,
} from './emailTemplates.js';

export const sendWelcomeEmail = async (email, name, profileUrl) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'Welcome to ProNet',
      html: createWelcomeEmailTemplate(name, profileUrl),
      category: 'welcome',
    });

    console.log('Welcome email sent', response);
  } catch (error) {
    throw error;
  }
};

export const sendCommentNotificationEmail = async (
  recipientEmail,
  recipientName,
  commenterName,
  postUrl,
  commentContent
) => {
  const recipient = [{ recipientEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: 'New Comment on Your Post',
      html: createCommentNotificationEmailTemplate(
        recipientName,
        commenterName,
        postUrl,
        commentContent
      ),
      category: 'comment_notification',
    });

    console.log('Comment notification email sent', response);
  } catch (error) {
    console.log('Error in sendCommentNotificationEmail Lib: ', error.message);
  }
};

export const sendConnectionAcceptedEmail = async (
  senderEmail,
  senderName,
  recipientName,
  profileUrl
) => {
  const recipient = [{ senderEmail }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: `${recipientName} accepted your connection request`,
      html: createConnectionAcceptedEmailTemplate(
        senderName,
        recipientName,
        profileUrl
      ),
      category: 'connection_accepted',
    });

    console.log('Connection request accepted email sent', response);
  } catch (error) {
    console.log('Error in sendConnectionRequestEmail Lib: ', error.message);
  }
};
