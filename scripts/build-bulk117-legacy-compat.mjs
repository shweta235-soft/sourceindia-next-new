/**
 * BULK117: reproduce original Express mount registration without loading original
 * server.js (which calls sequelize.sync(), backfills data, and starts port 5000).
 *
 * Only local uploaded source is read; never touches the user's React project.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const original=readFileSync(join(root,'legacy/sourceindia-express/ORIGINAL-MOUNTS.txt'),'utf8');
const mounts=JSON.parse(original);
const lines=[
 "'use strict';",
 '/** Generated from original backend/server.js; no sequelize.sync or server.listen. */',
 "const express=require('express');",
 "const cors=require('cors');",
 "const compression=require('compression');",
 'const app=express();',
 "app.disable('x-powered-by');",
 "app.use('/v2/api/admin',require('./routes/adminEnquiriesRoutes'));",
 'app.use(cors());',
 'app.use(compression());',
 'app.use(express.json());',
 'app.use(express.urlencoded({extended:true}));',
 "app.get('/v2/',(req,res)=>res.send('Node.js app is running under /v2'));",
 "app.use('/v2/upload',express.static(require('node:path').join(__dirname,'upload'),{maxAge:'30d'}));",
 ...mounts.filter(x=>!(x[0]==='/v2/api/admin'&&x[1]==='adminEnquiriesRoutes')).map(([path,id])=>`app.use(${JSON.stringify(path)},require('./routes/${id}'));`),
 'module.exports=app;',
 ''
];
writeFileSync(join(root,'legacy/sourceindia-express/compat-app.cjs'),lines.join('\n'));
console.log('BULK117 mounted legacy Express routers:',mounts.length);
