declare module 'nodemailer' {
  interface MailOptions { from:{name:string;address:string};to:string;subject:string;html:string }
  interface Transporter { sendMail(options:MailOptions):Promise<unknown>;close():void }
  const nodemailer:{createTransport(options:Record<string,unknown>):Transporter};
  export default nodemailer;
}
