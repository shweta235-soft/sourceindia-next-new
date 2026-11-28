import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const code=readFileSync('src/lib/localBulk121TicketAdmin.ts','utf8');
const app={admin: {role:2,category:7},lookups:[],query:[],db:true};
const pool={
 async execute(sql,args){app.lookups.push([sql,args]);
  if(sql.includes('FROM admins'))return [[app.admin===null?undefined:{admin_id:5,role:app.admin.role,role_id:app.admin.role,ticket_category:app.admin.category}],[]];
  if(sql.includes('COUNT(*)'))return [[{total:2}],[]];
  throw Error('unexpected execute');
 },
 async query(sql,args){app.query.push([sql,args]);return [[{id:3,category:7,title:'Sample'}],[]];},
};
const mod={exports:{}};
const requireStub=(s)=>{
 if(s.endsWith('/localAccountDatabase'))return {localAccountDatabase:()=>app.db?pool:null};
 if(s.endsWith('/adminSession'))return {adminSessionCookie:'si_admin_session',readAdminSession:(v)=>v==='ok'?{id:'5'}:undefined};
 throw Error('unexpected require '+s);
};
const js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
runInNewContext(js,{exports:mod.exports,module:mod,require:requireStub,URL,Response,Intl,Date,Number,RegExp,Set,Object,Array,console}, {filename:'localBulk121TicketAdmin.js'});
const api=mod.exports;
const request=(href='http://localhost:3000/admin/api/local/tickets/legacy-grid?page=1&limit=2',cookie='ok')=>({url:href,cookies:{get:()=>cookie?{value:cookie}:undefined}});
test('BULK121 date windows produce deterministic Kolkata business days',()=>{
 const now=new Date('2026-11-27T07:00:00.000Z');
 assert.deepEqual(Array.from(api.ticketDateFilter('today',null,null,now)),['2026-11-27 00:00:00','2026-11-27 23:59:59']);
 assert.deepEqual(Array.from(api.ticketDateFilter('yesterday',null,null,now)),['2026-11-26 00:00:00','2026-11-26 23:59:59']);
 assert.deepEqual(Array.from(api.ticketDateFilter('last7days',null,null,now)),['2026-11-21 00:00:00','2026-11-27 23:59:59']);
 assert.equal(api.ticketDateFilter('customrange','2026-11-31','2026-11-31',now),null);
 assert.equal(api.ticketDateFilter('customrange','2026-11-29','2026-11-27',now),null);
});
test('BULK121 grid plans apply forced category scope and parameterized LIKE',()=>{
 const p=api.ticketAdminGridPlan('http://localhost:3000/?page=1&limit=2&search=50%25_&sortBy=id&sort=DESC', {adminId:5,all:false,category:7});
 assert.ok(p);assert.match(p.whereSql,/t\.category=\?/);
 assert.equal(p.bind[0],7);
 assert.ok(p.bind.some(x=>typeof x==='string'&&x.includes('!%')));
 assert.equal(p.limit,2);
 assert.equal(api.ticketAdminGridPlan('http://localhost:3000/?sortBy=t.token',{adminId:5,all:true,category:null}),null);
 assert.equal(api.ticketAdminGridPlan('http://localhost:3000/?limit=999999',{adminId:5,all:true,category:null}),null);
 assert.equal(api.ticketAdminGridPlan('http://localhost:3000/?page=1&page=2',{adminId:5,all:true,category:null}),null);
});
test('BULK121 admin scope rejects unauthenticated users and missing category roles',async()=>{
 app.lookups.length=0;
 const unauth=await api.ticketAdminScope(request(undefined,null));
 assert.equal((await unauth.error.json()).message,'Unauthorized');
 assert.equal(app.lookups.length,0);
 app.admin={role:2,category:null};
 const forbidden=await api.ticketAdminScope(request());
 assert.equal(forbidden.error.status,403);
 app.admin={role:4,category:null};
 const superAdmin=await api.ticketAdminScope(request());
 assert.equal(superAdmin.scope.all,true);
 app.admin={role:2,category:7};
});
test('BULK121 authenticated grid filters by assigned ticket category',async()=>{
 app.lookups.length=0;app.query.length=0;
 const res=await api.ticketAdminGrid(request());
 assert.equal(res.status,200);
 const result=await res.json();
 assert.deepEqual(JSON.parse(JSON.stringify(result)),{data:[{id:3,category:7,title:'Sample'}],totalRecords:2,filteredRecords:2});
 assert.ok(app.lookups.some(([sql,args])=>sql.includes('COUNT(*)')&&sql.includes('t.category=?')&&args[0]===7));
 assert.ok(app.query[0][0].includes('t.category=?'));
 assert.equal(app.query[0][1][0],7);
 assert.equal(app.query[0][1][1],2);
});
