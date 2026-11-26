export function bulk111Id(value:unknown):number|null;
export function bulk111Query(params:URLSearchParams,owner:number,allowed?:string[]):null|{forbidden:true}|{userId:number;categoryId?:number};
export function bulk111InterestBody(input:unknown,owner:number):null|{userId:number;pairs:[number,number][]};
export function bulk111SourcingBody(input:unknown,owner:number):null|{userId:number;categoryId:number;ids:number[];action:'add'|'remove'|'replace'};
export function bulk111InterestTree(categories:Record<string,unknown>[],subs:Record<string,unknown>[],rows?:Record<string,unknown>[]):{categories:Record<string,unknown>[];subCategories:Record<string,unknown>;checked:Record<string,unknown>};
export function bulk111ItemTree(categories:Record<string,unknown>[],groups:Record<string,unknown>[],items:Record<string,unknown>[],counts:Record<string,unknown>[]):{categories:Record<string,unknown>[]};
export function bulk111MarkChecked(rows:Record<string,unknown>[]):{subcategories:Record<string,unknown>[];checkedCount:number};
