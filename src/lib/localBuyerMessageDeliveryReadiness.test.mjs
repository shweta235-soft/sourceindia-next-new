import test from 'node:test';
import assert from 'node:assert/strict';
import {assessMailReadiness,mailSettingsSql,template67Sql} from './localBuyerMessageDeliveryReadiness.ts';
const config=[['smtp_server_address','mail.example.com'],['smtp_port','587'],['smtp_username','mailer'],['smtp_password','hidden']].map(([meta_key,meta_value])=>({meta_key,meta_value}));
const template={email_id:67,subject:'New message',message_bytes:128};
test('complete settings and template report readiness but do not enable sending',()=>{
  assert.deepEqual(assessMailReadiness(config,template),{smtp_configured:true,template_67_ready:true,ready_for_transport_integration:true,sending_enabled:false});
});
test('missing SMTP password is not ready',()=>assert.equal(assessMailReadiness(config.filter(x=>x.meta_key!=='smtp_password'),template).smtp_configured,false));
test('missing template fails preflight',()=>assert.equal(assessMailReadiness(config,null).template_67_ready,false));
test('invalid port fails preflight',()=>assert.equal(assessMailReadiness([...config.filter(x=>x.meta_key!=='smtp_port'),{meta_key:'smtp_port',meta_value:'99999'}],template).smtp_configured,false));
test('SQL references original tables and template 67',()=>{assert.match(mailSettingsSql,/site_settings/); assert.match(template67Sql,/email_id = 67/);});
