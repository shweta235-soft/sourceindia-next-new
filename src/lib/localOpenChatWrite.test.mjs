import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const write = readFileSync(new URL('./localOpenChatWrite.ts', import.meta.url), 'utf8');
const handler = readFileSync(new URL('./localOpenChatWriteHandler.ts', import.meta.url), 'utf8');
const route = readFileSync(new URL('../app/api/local/enquiries/open/[id]/chats/route.ts', import.meta.url), 'utf8');
test('original Express chat table names and sender columns preserved',()=>{
  for(const field of ['open_enquriychats','enquiry_user_id','reply_user_id','enquiry_id','uuid'])assert.match(write,new RegExp(field));
});
test('validates message presence, length, control characters and extra fields',()=>{
  for(const term of ['typeof input.message','message.trim()', 'message.length > 2000','Object.keys(input).length !== 1','u0000'])assert.ok(write.includes(term),term);
});
test('requires local session rather than trusting user identity from request',()=>{
  assert.match(handler,/verifyLocalAuthToken/);assert.match(handler,/accountById\(claims.id\)/);
  assert.doesNotMatch(handler,/body\.user|body\.user_id|input\.user/);
});
test('checks owner before inserting new message',()=>{
  assert.ok(handler.indexOf('db.execute<RowDataPacket[]>(ownOpenChatQueries.owner') < handler.indexOf('db.execute<ResultSetHeader>(insertOwnedOpenChatSql'));
  assert.match(handler,/\[enquiryId, account.id\]/);
  assert.match(handler,/if \(!owned.length\) return fail\(404/);
});
test('uses placeholders and server-side UUID',()=>{
  assert.match(write,/VALUES \(\?, \?, \?, \?, \?, \?, NOW\(\), NOW\(\)\)/);
  assert.match(handler,/randomUUID\(\)/);
  assert.match(handler,/\[uuid, message, account.id, enquiryId, account.id, account.id\]/);
});
test('limits request size and only accepts JSON',()=>{
  assert.match(handler,/8192/);assert.match(handler,/application\/json/);assert.match(handler,/JSON.parse\(raw\)/);
});
test('returns 201, no cache, does not echo message',()=>{
  assert.match(handler,/status: 201/);assert.match(handler,/private, no-store/);
  assert.doesNotMatch(handler,/item: \{[^}]*message/s);
});
test('route exports literal node runtime and POST alongside previous GET',()=>{
  assert.match(route,/runtime = 'nodejs'/); assert.match(route,/export async function GET/);assert.match(route,/export async function POST/);
});
