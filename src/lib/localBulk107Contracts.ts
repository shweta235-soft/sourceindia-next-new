/** Bulk107: audited model-field validation. Original Express models are read-only.
 * This module intentionally imports no server facilities so validations can be tested without MySQL.
 */
export type Bulk107Input = string | number | null;
type FieldKind = 'short'|'long'|'nullableShort'|'nullableLong'|'nullableInt'|'int'|'bit';
type Entry = {required:string[];fields:Record<string,FieldKind>;slug:boolean;softDelete:boolean;uuid:boolean};
export const BULK107_CONFIG:Record<string,Entry> = {
  "product-categories": {
    "required": [
      "name"
    ],
    "fields": {
      "name": "short",
      "prefix": "nullableShort",
      "cat_file_id": "nullableInt",
      "stock_file_id": "nullableInt",
      "top_category": "bit",
      "is_other": "bit",
      "status": "bit"
    },
    "slug": true,
    "softDelete": false,
    "uuid": true
  },
  "product-subcategories": {
    "required": [
      "name",
      "category"
    ],
    "fields": {
      "name": "short",
      "category": "int",
      "file_id": "nullableInt",
      "status": "bit"
    },
    "slug": true,
    "softDelete": false,
    "uuid": true
  },
  "item-categories": {
    "required": [
      "name",
      "category_id",
      "subcategory_id"
    ],
    "fields": {
      "name": "short",
      "category_id": "int",
      "subcategory_id": "int",
      "file_id": "nullableInt",
      "status": "bit"
    },
    "slug": true,
    "softDelete": false,
    "uuid": true
  },
  "item-subcategories": {
    "required": [
      "name",
      "item_category_id",
      "category_id",
      "subcategory_id"
    ],
    "fields": {
      "name": "short",
      "item_category_id": "int",
      "category_id": "int",
      "subcategory_id": "int",
      "file_id": "nullableInt",
      "status": "bit"
    },
    "slug": true,
    "softDelete": false,
    "uuid": true
  },
  "product-keywords": {
    "required": [
      "name",
      "item_subcategory_id"
    ],
    "fields": {
      "name": "short",
      "item_subcategory_id": "int",
      "status": "bit"
    },
    "slug": false,
    "softDelete": false,
    "uuid": false
  },
  "home-banners": {
    "required": [
      "file_id"
    ],
    "fields": {
      "title": "nullableShort",
      "sub_title": "nullableShort",
      "description": "nullableLong",
      "button_text": "nullableShort",
      "button_url": "nullableShort",
      "file_id": "int",
      "status": "bit"
    },
    "slug": false,
    "softDelete": true,
    "uuid": true
  },
  "home-settings": {
    "required": [
      "page",
      "section",
      "meta_key",
      "meta_value"
    ],
    "fields": {
      "page": "short",
      "section": "short",
      "meta_key": "short",
      "meta_value": "long"
    },
    "slug": false,
    "softDelete": false,
    "uuid": true
  },
  "static-pages": {
    "required": [
      "title",
      "description",
      "is_edit"
    ],
    "fields": {
      "title": "short",
      "description": "long",
      "is_edit": "bit",
      "meta_title": "nullableShort",
      "meta_keyword": "nullableShort",
      "meta_description": "nullableShort"
    },
    "slug": false,
    "softDelete": true,
    "uuid": true
  },
  "mail-master": {
    "required": [
      "code",
      "list",
      "type"
    ],
    "fields": {
      "code": "short",
      "list": "short",
      "type": "short"
    },
    "slug": false,
    "softDelete": false,
    "uuid": false
  },
  "designations": {
    "required": [
      "name"
    ],
    "fields": {
      "name": "short",
      "status": "bit"
    },
    "slug": false,
    "softDelete": false,
    "uuid": true
  },
  "nature-businesses": {
    "required": [
      "name"
    ],
    "fields": {
      "name": "short",
      "status": "bit"
    },
    "slug": false,
    "softDelete": false,
    "uuid": true
  },
  "user-categories": {
    "required": [
      "name",
      "type",
      "user_type"
    ],
    "fields": {
      "name": "short",
      "type": "int",
      "user_type": "short",
      "status": "bit"
    },
    "slug": false,
    "softDelete": false,
    "uuid": true
  }
};
export const BULK107_KINDS = Object.freeze(Object.keys(BULK107_CONFIG));
export type Bulk107Kind = string;

/** The legacy models use slugify(..., {lower:true, strict:true}). Reject names
 * for which our conservative ASCII slug transformation would be empty. */
export function bulk107Slug(name:string):string|null {
 const slug=name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9\s_-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g,'-');
 return slug.length>0 && slug.length<=255 ? slug : null;
}
function value(kind:FieldKind, raw:unknown):Bulk107Input|undefined {
 if(kind==='bit') return raw===0||raw===1?raw:undefined;
 if(kind==='int'||kind==='nullableInt') {
  if(raw===null && kind==='nullableInt')return null;
  return typeof raw==='number'&&Number.isSafeInteger(raw)&&raw>=1&&raw<=2147483647?raw:undefined;
 }
 if(raw===null && (kind==='nullableShort'||kind==='nullableLong')) return null;
 if(typeof raw!=='string')return undefined;
 if(raw.length>(kind.includes('Long')||kind==='long'?16000:255)||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(raw))return undefined;
 const trimmed=raw.trim();
 if((kind==='short'||kind==='nullableShort')&&trimmed.length===0)return undefined;
 return trimmed;
}
export function bulk107Parse(kind:string, input:unknown, action:'create'|'update'):Record<string,Bulk107Input>|null {
 const spec=BULK107_CONFIG[kind];
 if(!spec || !input || typeof input!=='object'||Array.isArray(input))return null;
 const data=input as Record<string,unknown>;
 const keys=Object.keys(data);
 if(keys.length===0 || keys.length>Object.keys(spec.fields).length || keys.some(k=>!Object.prototype.hasOwnProperty.call(spec.fields,k)))return null;
 if(action==='create'&&spec.required.some(k=>!Object.prototype.hasOwnProperty.call(data,k)))return null;
 const out:Record<string,Bulk107Input>={};
 for(const k of keys){
  const parsed=value(spec.fields[k],data[k]);
  if(parsed===undefined)return null;
  out[k]=parsed;
 }
 if(spec.slug && Object.prototype.hasOwnProperty.call(out,'name')){
  const slug=bulk107Slug(String(out.name));if(!slug)return null;
  out.slug=slug;
 }
 return out;
}
