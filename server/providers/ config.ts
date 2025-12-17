export const EMAIL_FROM = 'humberto.pansica@urbanmobi.com.br';

export const confirEmailTemplate = `

<head>
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Urban Mobi - Validação de Conta</title>
  <style media="all" type="text/css">
    @media only screen and (max-width: 480px) {
      table[class=body] h1 {
        font-size: 24px !important;
      }

      table[class=body] h2 {
        font-size: 20px !important;
      }

      table[class=body] h3 {
        font-size: 14px !important;
      }

      table[class=body] .content,
      table[class=body] .wrapper {
        padding: 15px !important;
      }

      table[class=body] .container {
        width: 100% !important;
        padding: 0 !important;
      }

      table[class=body] .column {
        width: 100% !important;
      }

      table[class=body] .stats .column {
        width: 50% !important;
      }

      table[class=body] .hero-image,
      table[class=body] .thumb {
        width: 100% !important;
        height: auto !important;
      }

      table[class=body] .btn table,
      table[class=body] .btn a {
        width: 100% !important;
      }

      table[class=body] .stats-table {
        display: none !important;
      }

      table[class=body] .stats-labels .label,
      table[class=body] .category-labels .label {
        font-size: 10px !important;
      }

      table[class=body] .credits table {
        table-layout: auto !important;
      }

      table[class=body] .credits .label {
        font-size: 11px !important;
      }
    }
  </style>
  <style type="text/css">
    @font-face {
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 300;
      src: local('Open Sans Light'), local('OpenSans-Light'), url(https://fonts.gstatic.com/s/opensans/v13/DXI1ORHCpsQm3Vp6mXoaTYnF5uFdDttMLvmWuJdhhgs.ttf) format('truetype');
    }

    @font-face {
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 400;
      src: local('Open Sans'), local('OpenSans'), url(https://fonts.gstatic.com/s/opensans/v13/cJZKeOuBrn4kERxqtaUH3aCWcynf_cDxXwCLxiixG1c.ttf) format('truetype');
    }

    @font-face {
      font-family: 'Open Sans';
      font-style: normal;
      font-weight: 600;
      src: local('Open Sans Semibold'), local('OpenSans-Semibold'), url(https://fonts.gstatic.com/s/opensans/v13/MTP_ySUJH_bn48VBG8sNSonF5uFdDttMLvmWuJdhhgs.ttf) format('truetype');
    }
  </style>
  <!--[if mso]>
		<style>
		  h1, h2, h3, h4,
		  p, ol, ul {
		    font-family: Arial, sans-serif !important;
		  }
		</style>
	<![endif]-->
</head>

<body style="font-size: 16px; background-color: #000000; margin: 0; padding: 16px; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; line-height: 1.5; -ms-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; height: 100% !important; width: 100% !important;">
  <table bgcolor="#000000" class="body" style="box-sizing: border-box; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; width: 100%; background-color: #000000; border-collapse: separate !important;" width="100%">
    <tbody>
      <tr>
        <td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;</td>
        <td class="container" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; display: block; width: 600px; max-width: 600px; margin: 0 auto !important;" valign="top" width="600">
          <div class="content" style="box-sizing: border-box; display: block; max-width: 600px; margin: 0 auto; padding: 10px;"><span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">Agora vamos confirmar seu endereço de e-mail.</span>
            <div class="header" style="box-sizing: border-box; width: 100%; margin-bottom: 30px; margin-top: 15px;">
              <table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: separate !important;" width="100%">
                <tbody>
                  <tr>
                    <td align="center" class="align-center" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; text-align: left;" valign="top">
                      <span class="sg-image" data-imagelibrary="http://cdn.mcauto-images-production.sendgrid.net/46608c2999d44d7b/767f453f-66cc-4ae8-8fe8-9ccd7da83039/249x66.png">
                        <a href="https://www.urbanmobi.com.br" style="box-sizing: border-box; color: #000000; font-weight: 400; text-decoration: none;" target="_blank">
                          <img alt="Urban Mobi" height="28" src="http://cdn.mcauto-images-production.sendgrid.net/46608c2999d44d7b/767f453f-66cc-4ae8-8fe8-9ccd7da83039/249x66.png" style="max-width: 200px; border-style: none; width: 160px; height: auto;" width="160"></a></span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="block" style="box-sizing: border-box; width: 100%; margin-bottom: 30px; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px">
              <table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: separate !important;" width="100%">
                <tbody>
                  <tr>
                    <td class="wrapper" style="box-sizing: border-box; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; padding: 30px;" valign="top">
                      <table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: separate !important;" width="100%">
                        <tbody>
                          <tr>
                            <td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">
                              <h2 style="margin: 0; margin-bottom: 30px; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-weight: 300; line-height: 1.5; font-size: 24px; color: #000000 !important; text-align: center;">Olá, seja bem vindo à Urban Mobi.</h2>

                              <p style="margin: 0; margin-bottom: 30px; color: #000000; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 300; text-align: center;">
                                Clique no botão abaixo para confirmar seu e-mail e ativar sua conta.
                                
                              </p>
                              <p style="margin: 0; margin-bottom: 30px; color: #000000; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 300; text-align: center;">
                                <span style="font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px;">Endereço de e-mail cadastrado:</span>
                                <br>
                                <span style="font-weight: bold; font-size: 18px;">["name"]</span>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">
                              <table cellpadding="0" cellspacing="0" class="btn btn-primary" style="box-sizing: border-box; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; width: 100%; border-collapse: separate !important;" width="100%">
                                <tbody>
                                  <tr>
                                    <td align="center" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; padding-bottom: 15px;" valign="top">
                                      <table cellpadding="0" cellspacing="0" style="box-sizing: border-box; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; width: auto; border-collapse: separate !important;">
                                        <tbody>
                                          <tr>
                                            <td align="center" bgcolor="#33ffcc" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; background-color: #33ffcc; border-radius: 8px; text-align: center;" valign="top">
                                              <a href="[" link"]" style="box-sizing: border-box; border-color: #33ffcc; font-weight: bold; text-decoration: none; display: inline-block; margin: 0; color: #000000; background-color: #33ffcc; border: solid 1px #33ffcc; border-radius: 8px; cursor: pointer; font-size: 14px; padding: 12px 45px;" target="_blank">Confirmar meu endereço de e-mail</a>
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer" style="box-sizing: border-box; clear: both; width: 100%;">
              <table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; font-size: 12px; border-collapse: separate !important;" width="100%">
                <tbody>
                  <tr style="font-size: 12px;">
                    <td align="center" class="align-center" style="box-sizing: border-box; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; vertical-align: top; font-size: 12px; text-align: center; padding: 20px 0;" valign="top"><span class="sg-image" data-imagelibrary="http://cdn.mcauto-images-production.sendgrid.net/46608c2999d44d7b/767f453f-66cc-4ae8-8fe8-9ccd7da83039/249x66.png" style="float: none; display: block; text-align: center;">

                        <a href="https://www.urbanmobi.com.br" style="box-sizing: border-box; color: #6b6b6b; font-weight: 400; text-decoration: none; font-size: 12px;" target="_blank">
                          <img alt="Urban Mobi" width="123" height="32" src="http://cdn.mcauto-images-production.sendgrid.net/46608c2999d44d7b/767f453f-66cc-4ae8-8fe8-9ccd7da83039/249x66.png" style="max-width: 100%; border-style: none; font-size: 12px;"></a></span>

                      <p class="tagline" style="color: #6b6b6b; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; margin-bottom: 5px; margin: 10px 0 20px;">Enviado com segurança por SendGrid.</p>

                      <p style="margin: 0; color: #6b6b6b; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-weight: 300; font-size: 12px; margin-bottom: 5px;">© 2025 - Urban Mobi - Todos os direitos reservados.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </td>
        <td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;</td>
      </tr>
    </tbody>
  </table>
</body>

`;
