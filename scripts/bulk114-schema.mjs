/** Columns actually referenced by the five public taxonomy SQL queries. */
export const BULK114_TABLES={
 categories:['category_id','name','status','is_delete'],
 sub_categories:['sub_category_id','uuid','name','slug','category','file_id','status','is_delete'],
 item_category:['item_category_id','uuid','name','slug','file_id','category_id','subcategory_id','status','is_delete'],
 item_subcategory:['item_subcategory_id','uuid','name','slug','file_id','category_id','subcategory_id','item_category_id','status','is_delete'],
 items:['item_id','uuid','name','slug','file_id','category_id','subcategory_id','item_category_id','item_sub_category_id','status','is_delete'],
 product_keywords:['product_keyword_id','name','status','is_main','item_subcategory_id']
};
