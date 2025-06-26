import type { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import sgMail from '@sendgrid/mail';

import { EMAIL_FROM } from './ config';

class Mailer {
  defaults = {
    from: EMAIL_FROM,
    subject: 'Urban Mobi - Validação de Conta',
  };

  sender: typeof sgMail;

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
    this.sender = sgMail;
  }

  async sendEmail(to: string, link: string) {
    const message: MailDataRequired = {
      ...this.defaults,
      to,
      html: `
        <div style="padding: 24px; background-color: #000000; text-align: center">
        <img src="http://cdn.mcauto-images-production.sendgrid.net/bcf3e99e4ff99531/e21f26b7-b20c-4a9d-bae2-cf01db7f035a/711x717.png" style="max-width: 48px; margin: 0 auto;"/>
          <h3 style="color: white; font-weight: bold">Verifique seu e-mail cadastrado</h3>
          <p style="color: white;">
            Olá ${to}, clique no link abaixo para validar sua conta Urban Mobi.
          </p>
          <a href="${link}" style="padding: 8px;border: 1px solid red">Validar E-mail</a>
        </div>
      `,
    };
    return await this.sender.send(message);
  }
}
export const mailer = new Mailer();
