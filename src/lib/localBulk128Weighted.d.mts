export function weightedFrontMenuKeywords(query:string, keywords:Array<{id:number;name:string;item_subcategory_id:number}>, limit?:number): Array<{id:number;title:string;category:number|null;sub_category:number|null;item_category_id:number|null;item_subcategory_id:number|null}>;
export function weightedFrontMenuSearchWords(query:string):string[];
