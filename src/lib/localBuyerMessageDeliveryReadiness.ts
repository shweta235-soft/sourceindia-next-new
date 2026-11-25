/** Bulk85: delivery prerequisites. No SMTP credentials or template content are returned. */
export const mailSettingsSql = `SELECT meta_key, meta_value FROM site_settings
  WHERE meta_key IN ('smtp_server_address','smtp_port','smtp_username','smtp_password','smtp_from_address','smtp_from_name')`;
export const template67Sql = `SELECT email_id, subject, OCTET_LENGTH(message) AS message_bytes
  FROM emails WHERE email_id = 67 LIMIT 1`;
export type MailSetting = {meta_key:string;meta_value:string|null};
export type MailTemplate = {email_id:number;subject:string|null;message_bytes:number};
export function assessMailReadiness(settings:MailSetting[],template:MailTemplate|null) {
  const values=new Map(settings.map(s=>[s.meta_key,(s.meta_value??'').trim()]));
  const port=Number(values.get('smtp_port'));
  const settingsComplete=Boolean(values.get('smtp_server_address')) &&
    Number.isInteger(port) && port>=1 && port<=65535 &&
    Boolean(values.get('smtp_username')) && Boolean(values.get('smtp_password'));
  const templateReady=Boolean(template && (template.message_bytes??0)>0);
  return {smtp_configured:settingsComplete,template_67_ready:templateReady,
    ready_for_transport_integration:settingsComplete && templateReady,
    sending_enabled:false};
}
