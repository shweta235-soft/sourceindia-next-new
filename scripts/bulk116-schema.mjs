/** Read-only INFORMATION_SCHEMA preflight for new public product adapters. */
export const BULK116_TABLES=Object.freeze({
 products:['product_id','user_id','company_id','slug','title','code','article_number','content','short_description','description','quantity','category','sub_category','item_category_id','item_subcategory_id','item_id','keyword_id','file_id','file_ids','is_gold','is_featured','is_recommended','best_product','status','is_approve','is_delete','created_at','approved_at'],
 users:['user_id','company_id','fname','lname','status','is_delete','is_approve','state','country','city','address','zipcode','is_seller','is_trading'],
 company_info:['company_id','organization_name','organization_slug','company_location','brief_company','company_website','organizations_product_description','user_category','core_activity','activity','is_verified','is_star_seller','featured_company','is_delete','company_logo','created_at'],
 upload_images:['upload_image_id','file'],
 categories:['category_id','name'],sub_categories:['sub_category_id','name'],item_category:['item_category_id','name'],
 item_subcategory:['item_subcategory_id','name','item_category_id','category_id','subcategory_id','is_delete','status'],
 items:['item_id','name'],states:['state_id','name'],countries:['country_id','name'],cities:['city_id','name'],
 product_keywords:['product_keyword_id','item_subcategory_id','name','status'],
 review_ratings:['product_id','rating'],
});
