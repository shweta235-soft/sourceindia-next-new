export interface CatalogPage { page:number;limit:number;offset:number;q:string|null;filters:Record<string,number> }
export interface CatalogSql { sql:string;values:(number|string)[] }
export const BULK114_FAMILIES:Readonly<Record<string,{from:string;select:string;where:string;filters:Readonly<Record<string,string>>;search:string;sort:string;detailId:string}>>;
export function bulk114Id(input:unknown):number|null;
export function bulk114Parse(url:string,family:string,fixed?:Record<string,string>,mode?:string):CatalogPage|null;
export function bulk114Sql(family:string,kind:'list'|'count'|'detail',parsed:CatalogPage,id?:number|null):CatalogSql|null;
export function bulk114SearchTerm(raw:unknown):string|null;
