/** Identify the real unique row key in a pre-existing newsletter history table.
 * The legacy Sequelize model calls it newsletter_history_id, but deployed MySQL
 * schemas may use a different physical column. Never guess from a column name:
 * accept only a single-column numeric PRIMARY/UNIQUE key or a UNIQUE uuid column.
 * This module performs no SQL and makes no changes to the schema or records.
 */
const safeIdentifier=/^[A-Za-z_][A-Za-z0-9_]*$/;
const integerTypes=new Set(['tinyint','smallint','mediumint','int','integer','bigint']);
export function resolveNewsletterHistoryIdentity(columns) {
 if(!Array.isArray(columns))return null;
 const valid=columns.filter(c=>c&&typeof c.COLUMN_NAME==='string'&&safeIdentifier.test(c.COLUMN_NAME)&&typeof c.COLUMN_KEY==='string'&&typeof c.DATA_TYPE==='string');
 const primary=valid.filter(c=>c.COLUMN_KEY.toUpperCase()==='PRI');
 // A composite PK is not a stable single-column row identifier.
 if(primary.length===1&&integerTypes.has(primary[0].DATA_TYPE.toLowerCase()))return primary[0].COLUMN_NAME;
 // UUID is the legacy model's unique nonnullable column, safe as a last resort
 // for readonly reporting; if the table has no reliable key, fail closed.
 const uniqueInt=valid.find(c=>c.COLUMN_KEY.toUpperCase()==='UNI'&&integerTypes.has(c.DATA_TYPE.toLowerCase()));
 if(uniqueInt)return uniqueInt.COLUMN_NAME;
 const uuid=valid.find(c=>c.COLUMN_NAME==='uuid'&&c.COLUMN_KEY.toUpperCase()==='UNI'&&['char','varchar'].includes(c.DATA_TYPE.toLowerCase()));
 return uuid?.COLUMN_NAME??null;
}
export function newsletterHistoryIdExpression(name) {
 if(typeof name!=='string'||!safeIdentifier.test(name))throw new TypeError('Invalid database identifier');
 return `h.\`${name}\``;
}
