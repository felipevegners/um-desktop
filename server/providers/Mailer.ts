import type { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import sgMail from '@sendgrid/mail';

import { EMAIL_FROM, confirEmailTemplate } from './ config';

class Mailer {
  defaults = {
    from: EMAIL_FROM,
    sender: 'Humberto Pansica',
    subject: 'Urban Mobi - Validação de Conta',
  };

  sender: typeof sgMail;

  constructor() {
    sgMail.setApiKey(process.env.VITE_SENDGRID_API_KEY as string);
    this.sender = sgMail;
  }

  async sendEmail(to: string, link: string) {
    const message: MailDataRequired = {
      ...this.defaults,
      to,
      html: confirEmailTemplate.replace('["name"]', to).replace('["link"]', link),
    };
    try {
      return await this.sender.send(message);
    } catch (error) {
      console.error('ERROR DURING SEND EMAIL -> ', error);
      console.error('SEND GRID API KEY -> ', process.env.VITE_SENDGRID_API_KEY);
    }
  }
}
export const mailer = new Mailer();
