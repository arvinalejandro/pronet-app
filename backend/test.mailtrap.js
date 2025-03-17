import { MailtrapClient } from 'mailtrap';

const TOKEN = 'cebe9e1e1ca99b90aaf7993f81e8c32a';

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: 'hello@demomailtrap.com',
  name: 'Mailtrap Test',
};
const recipients = [
  {
    email: 'arvinalejandro@gmail.com',
  },
];

client
  .send({
    from: sender,
    to: recipients,
    subject: 'You are awesome!',
    text: 'Congrats for sending test email with Mailtrap!',
    category: 'Integration Test',
  })
  .then(console.log, console.error);
