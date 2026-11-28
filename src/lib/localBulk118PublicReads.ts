/** BULK118: Native, read-only handlers for selected legacy v2 taxonomy endpoints.
 * Contract references: original controllers/{activity,coreActivity,faqCategory}Controller.js
 * This is a targeted valid-input contract implementation, NOT full 1:1 response parity.
 * It never calls the legacy Express bridge or mutates database rows.
 */
import type { RowDataPacket } from 'mysql2';
import { localAccountDatabase } from '@/lib/localAccountDatabase';

const reply = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const unavailable = () => reply({ message: 'Local database not configured.' }, 503);
const failure = () => reply({ message: 'Local lookup temporarily unavailable.' }, 503);
const invalid = () => reply({ message: 'Invalid identifier or filter.' }, 400);
const statusName = (status: unknown) => Number(status) === 1 ? 'Active' : 'Inactive';
const parseId = (value: string) => /^(?:[1-9]\d{0,14})$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
const parseFlag = (req: Request, key: string): number | null | undefined => {
  const raw = new URL(req.url).searchParams.get(key);
  if (raw === null) return undefined;
  if (!/^(?:0|1)$/.test(raw)) return null;
  return Number(raw);
};
const simpleDateRows = (rows: RowDataPacket[]) => rows.map(row => ({ ...row }));

const activityColumns = 'a.activity_id AS id,a.uuid,a.name,a.coreactivity,a.status,a.created_at,a.updated_at,a.is_delete';
const coreColumns = 'ca.core_activity_id AS id,ca.uuid,ca.name,ca.color,ca.status,ca.file_id,ca.created_at,ca.updated_at,ca.is_delete';
// Legacy Sequelize uses UTC sessions (default timezone +00:00); our mysql2
// pool inherits the MySQL server's session timezone. The Windows differential
// test demonstrated that FAQ updated_at is 330 minutes AHEAD of legacy while
// created_at matches on the same rows. This is consistent with an updated_at
// TIMESTAMP converted into the server's local timezone, as opposed to the
// original Sequelize UTC session. Convert *updated_at only* from the current
// MySQL session offset to UTC. Derive the offset at query time so this also
// works when MySQL runs in UTC or another timezone; never hardcode +05:30.
// created_at is deliberately left unchanged because it already matches legacy.
// Keep the zero/incomplete date -> JSON null behavior from BULK118.
const faqUtcDate = (column: 'created_at' | 'updated_at') => {
  const value = column === 'updated_at'
    ? 'DATE_ADD(f.updated_at, INTERVAL TIMESTAMPDIFF(SECOND, NOW(), UTC_TIMESTAMP()) SECOND)'
    : 'f.created_at';
  return `CASE WHEN f.${column} IS NULL OR YEAR(f.${column})=0 OR MONTH(f.${column})=0 OR DAYOFMONTH(f.${column})=0 THEN NULL ELSE CONCAT(LEFT(DATE_FORMAT(${value}, '%Y-%m-%dT%H:%i:%s.%f'), 23), 'Z') END AS ${column}`;
};
const faqColumns = `f.faqcategory_id AS id,f.uuid,f.name,f.status,${faqUtcDate('created_at')},${faqUtcDate('updated_at')}`;

export async function getActivities(req: Request): Promise<Response> {
  const deleted = parseFlag(req, 'is_delete'), status = parseFlag(req, 'status');
  if (deleted === null || status === null) return invalid();
  const db = localAccountDatabase(); if (!db) return unavailable();
  const conditions: string[] = []; const args: number[] = [];
  if (deleted !== undefined) { conditions.push('a.is_delete=?'); args.push(deleted); }
  if (status !== undefined) { conditions.push('a.status=?'); args.push(status); }
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${activityColumns}, ca.core_activity_id AS joined_core_id,ca.name AS joined_core_name
      FROM activities a LEFT JOIN core_activities ca ON ca.core_activity_id=a.coreactivity
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY a.activity_id ASC`, args);
    return reply(rows.map(({joined_core_id, joined_core_name, ...row}) => ({
      ...row, CoreActivity: joined_core_id === null || joined_core_id === undefined ? null : {id:joined_core_id,name:joined_core_name},
      getStatus:statusName(row.status), coreactivity_name:joined_core_name || null,
    })));
  } catch { return failure(); }
}

export async function getActivityById(id: string): Promise<Response> {
  const parsed = parseId(id); if (parsed === null) return invalid();
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${activityColumns} FROM activities a WHERE a.activity_id=? LIMIT 1`, [parsed]);
    return rows[0] ? reply({ ...rows[0] }) : reply({message:'Activity not found'}, 404);
  } catch { return failure(); }
}

export async function getActivitiesByCore(id: string): Promise<Response> {
  const parsed = parseId(id); if (parsed === null) return invalid();
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${activityColumns},
      (SELECT COUNT(*) FROM company_info ci WHERE ci.activity=a.activity_id) AS company_count
      FROM activities a WHERE a.coreactivity=? ORDER BY a.activity_id ASC`, [parsed]);
    return reply(simpleDateRows(rows));
  } catch { return failure(); }
}

export async function getActivityCount(): Promise<Response> {
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT
      (SELECT COUNT(*) FROM activities WHERE is_delete=0) AS activities,
      (SELECT COUNT(*) FROM core_activities WHERE is_delete=0) AS coreActivities`);
    return reply({activities:Number(rows[0]?.activities ?? 0),coreActivities:Number(rows[0]?.coreActivities ?? 0)});
  } catch { return failure(); }
}

export async function getCoreActivities(req: Request): Promise<Response> {
  const deleted = parseFlag(req, 'is_delete'); if (deleted === null) return invalid();
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${coreColumns},
      (SELECT COUNT(*) FROM company_info ci WHERE ci.core_activity=ca.core_activity_id) AS company_count
      FROM core_activities ca ${deleted === undefined ? '' : 'WHERE ca.is_delete=?'}
      ORDER BY ca.core_activity_id ASC`, deleted === undefined ? [] : [deleted]);
    return reply(rows.map(row => ({...row, getStatus:statusName(row.status), company_count:Number(row.company_count)})));
  } catch { return failure(); }
}

export async function getCoreActivityCount(): Promise<Response> {
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM core_activities WHERE is_delete=0');
    return reply({total:Number(rows[0]?.total ?? 0)});
  } catch { return failure(); }
}

export async function getCoreActivityById(id: string): Promise<Response> {
  const parsed = parseId(id); if (parsed === null) return invalid();
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${coreColumns}, u.file AS image_file
      FROM core_activities ca LEFT JOIN upload_images u ON u.upload_image_id=ca.file_id
      WHERE ca.core_activity_id=? LIMIT 1`, [parsed]);
    if (!rows[0]) return reply({message:'Core activity not found'},404);
    const {image_file,...row}=rows[0];
    return reply({...row, UploadImage:image_file === null || image_file === undefined ? null : {file:image_file},file_name:image_file ?? null});
  } catch { return failure(); }
}

export async function getCoreColors(): Promise<Response> {
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT color_id AS id,uuid,title,status,created_at,updated_at FROM colors ORDER BY color_id ASC`);
    return reply(simpleDateRows(rows));
  } catch { return failure(); }
}

export async function getFaqCategories(req: Request): Promise<Response> {
  const all = new URL(req.url).searchParams.get('all');
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${faqColumns} FROM faqcategories f
      ${all !== null && all.length ? '' : 'WHERE f.status=1'} ORDER BY f.faqcategory_id ASC`);
    return reply(simpleDateRows(rows));
  } catch { return failure(); }
}

export async function getFaqCategoryById(id: string): Promise<Response> {
  const parsed = parseId(id); if (parsed === null) return invalid();
  const db = localAccountDatabase(); if (!db) return unavailable();
  try {
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT ${faqColumns} FROM faqcategories f WHERE f.faqcategory_id=? LIMIT 1`, [parsed]);
    return rows[0] ? reply({...rows[0]}) : reply({message:'Faq Category not found'},404);
  } catch { return failure(); }
}

/** Legacy admin grid read contracts: the original Express controllers return
 * {data,totalRecords,filteredRecords}. Querying is intentionally bounded and
 * the sort identifiers are allowlisted to avoid interpolating untrusted SQL.
 */
type GridKind = 'activity' | 'core' | 'faq';
type GridQuery = {
  limit: number; offset: number; order: string;
  search: string; deleted: 0 | 1;
  startDate?: Date; endDate?: Date;
};
const gridOrder: Record<GridKind,Record<string,string>> = {
  activity: {id:'a.activity_id',name:'a.name',created_at:'a.created_at',updated_at:'a.updated_at',coreactivity_name:'ca.name'},
  core: {id:'ca.core_activity_id',name:'ca.name',created_at:'ca.created_at',updated_at:'ca.updated_at',color_name:'cl.title'},
  faq: {id:'f.faqcategory_id',name:'f.name',created_at:'f.created_at',updated_at:'f.updated_at'},
};
function startOfDay(date:Date):Date {const value=new Date(date);value.setHours(0,0,0,0);return value;}
function endOfDay(date:Date):Date {const value=new Date(date);value.setHours(23,59,59,999);return value;}
function gridDateRange(q:URLSearchParams):{startDate:Date;endDate:Date}|null {
  const range=(q.get('dateRange')??'').toLowerCase().replace(/\s+/g,'');
  if(!range)return null;
  const now=new Date(), today=startOfDay(now);
  let startDate:Date, endDate=now;
  const offsetDays=(days:number)=>new Date(today.getFullYear(),today.getMonth(),today.getDate()-days);
  if(range==='today'){startDate=today;}
  else if(range==='yesterday'){startDate=offsetDays(1);endDate=endOfDay(startDate);}
  else if(range==='last7days'){startDate=offsetDays(6);}
  else if(range==='last30days'){startDate=offsetDays(29);}
  else if(range==='thismonth'){startDate=new Date(today.getFullYear(),today.getMonth(),1);}
  else if(range==='lastmonth'){
    startDate=new Date(today.getFullYear(),today.getMonth()-1,1);
    endDate=endOfDay(new Date(today.getFullYear(),today.getMonth(),0));
  } else if(range==='customrange'){
    const start=q.get('startDate'),end=q.get('endDate');
    if(!start||!end||!/\d{4}-\d{2}-\d{2}/.test(start)||!/\d{4}-\d{2}-\d{2}/.test(end))return null;
    const a=new Date(start+'T00:00:00'),b=new Date(end+'T00:00:00');
    if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||a>b)return null;
    startDate=startOfDay(a);endDate=endOfDay(b);
  } else if(/^\d{1,3}$/.test(range)){
    const days=Number(range);if(days<1||days>365)return null;
    startDate=offsetDays(days-1);
  } else return null;
  return {startDate,endDate};
}
function parseGridQuery(req:Request,kind:GridKind):GridQuery|null {
  const q=new URL(req.url).searchParams;
  const readInt=(key:string,fallback:number)=>{
    const raw=q.get(key);if(raw===null)return fallback;
    return /^(?:[1-9]\d{0,6})$/.test(raw)?Number(raw):null;
  };
  const page=readInt('page',1),limit=readInt('limit',10);
  if(!page||!limit||limit>100||page>100000||!Number.isSafeInteger((page-1)*limit))return null;
  const sortBy=q.get('sortBy')??'id';
  const direction=q.get('sort')==='ASC'?'ASC':q.get('sort')==='DESC'?'DESC':'DESC';
  const selected=gridOrder[kind][sortBy];
  const order=selected ? `${selected} ${direction}` : `${gridOrder[kind].id} DESC`;
  const search=q.get('search')??'';
  if(search.length>160)return null;
  const range=gridDateRange(q);
  if(q.get('dateRange')?.trim() && q.get('dateRange')?.toLowerCase().replace(/\s+/g,'')==='customrange'&&!range)return null;
  return {limit,offset:(page-1)*limit,search,order,deleted:q.get('getDeleted')==='true'?1:0,...(range??{})};
}
export async function getGrid(req:Request,kind:GridKind):Promise<Response> {
  const grid=parseGridQuery(req,kind);if(!grid)return invalid();
  const db=localAccountDatabase();if(!db)return unavailable();
  const alias=kind==='activity'?'a':kind==='core'?'ca':'f';
  const from=kind==='activity'?'FROM activities a LEFT JOIN core_activities ca ON ca.core_activity_id=a.coreactivity':
    kind==='core'?'FROM core_activities ca LEFT JOIN colors cl ON cl.color_id=ca.color LEFT JOIN upload_images ui ON ui.upload_image_id=ca.file_id':
    'FROM faqcategories f';
  const where=kind==='faq'?'':'WHERE '+alias+'.is_delete=?';
  const args:(number|string|Date)[]=kind==='faq'?[]:[grid.deleted];
  const clauses:string[]=[];
  if(grid.search){
    const term=`%${grid.search}%`;
    clauses.push(kind==='activity'?'(a.name LIKE ? OR ca.name LIKE ?)':kind==='core'?'(ca.name LIKE ? OR cl.title LIKE ?)':'f.name LIKE ?');
    args.push(term);if(kind!=='faq')args.push(term);
  }
  if(grid.startDate&&grid.endDate&&kind!=='faq'){
    clauses.push(`${alias}.created_at BETWEEN ? AND ?`);
    args.push(grid.startDate,grid.endDate);
  }
  const filteredWhere=clauses.length?`${where?' AND':'WHERE'} ${clauses.join(' AND ')}`:'';
  const select=kind==='activity'?`SELECT a.activity_id AS id,a.name,a.coreactivity,ca.name AS coreactivity_name,a.status,a.is_delete,a.created_at,a.updated_at`:
    kind==='core'?`SELECT ca.core_activity_id AS id,ca.name,ca.color,cl.title AS color_name,ca.file_id,ui.file AS file_name,ca.status,ca.is_delete,ca.created_at,ca.updated_at`:
    `SELECT f.faqcategory_id AS id,f.name,f.status,${faqUtcDate('created_at')},${faqUtcDate('updated_at')}`;
  try{
    const baseArgs=kind==='faq'?[]:[grid.deleted];
    const [[totalRows],[filteredRows],[listRows]]=await Promise.all([
      db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from} ${where}`,baseArgs),
      db.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from} ${where}${filteredWhere}`,args),
      db.execute<RowDataPacket[]>(`${select} ${from} ${where}${filteredWhere} ORDER BY ${grid.order} LIMIT ? OFFSET ?`,[...args,grid.limit,grid.offset]),
    ]);
    return reply({data:simpleDateRows(listRows),totalRecords:Number(totalRows[0]?.total??0),filteredRecords:Number(filteredRows[0]?.total??0)});
  }catch{return failure();}
}
