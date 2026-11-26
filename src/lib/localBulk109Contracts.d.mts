export declare const BULK109_KINDS: ReadonlyArray<string>;
export declare const BULK109_ACTIONS: ReadonlyArray<string>;
export declare function bulk109Id(value: string): number | null;
export declare function bulk109Page(params: URLSearchParams): {page:number;limit:number;offset:number}|null;
export declare function bulk109Like(value: string): string;
export declare function bulk109Text(value: string|null,max?:number): string|null;
export declare function bulk109BooleanFlag(value: string|null): boolean|null;
export declare function bulk109Search(params: URLSearchParams): string|null;
export declare function bulk109Sort(params: URLSearchParams,allowed:Record<string,string>,defaultCol:string):string|null;
export declare function bulk109Query(params:URLSearchParams,kind:string):boolean;
export declare function bulk109IndiaBounds(now?:Date):[string,string];

export declare function bulk109UsersPageFirst(kind:string,params:URLSearchParams):boolean;
export declare function bulk109OrderByIds<T extends {id:number|string}>(ids:number[],rows:T[]):T[];
