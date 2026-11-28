declare module 'nodemailer' {
 const nodemailer: {
  createTransport(config: {
   host:string;port:number;secure:boolean;auth:{user:string;pass:string};
   connectionTimeout:number;greetingTimeout:number;socketTimeout:number;
  }): { sendMail(message:{from:{name:string;address:string};to:string;subject:string;html:string}):Promise<unknown>;close():void };
 };
 export default nodemailer;
}
