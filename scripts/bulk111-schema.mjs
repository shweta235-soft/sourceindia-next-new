/** Only INFORMATION_SCHEMA is queried. Column names match original Sequelize models. */
export const BULK111_TABLES=Object.freeze({
 users:['user_id','fname','lname','email','is_seller','is_delete','status','is_intrest'],
 interest_categories:['interest_category_id','uuid','name','color','file_id','status','created_at','updated_at'],
 interest_sub_categories:['interest_sub_category_id','uuid','interest_category_id','name','status','created_at','updated_at'],
 buyerinterests:['buyerinterest_id','uuid','buyer_id','core_activity_id','activity_id','created_at','updated_at'],
 categories:['category_id','name','status','is_delete'],
 sub_categories:['sub_category_id','name','category','status','is_delete'],
 item_category:['item_category_id','name','slug','subcategory_id','category_id','status','is_delete'],
 item_subcategory:['item_subcategory_id','name','slug','item_category_id','category_id','subcategory_id','status','is_delete'],
 buyer_sourcing_interests:['buyer_sourcing_interest_id','uuid','user_id','item_category_id','item_subcategory_id','created_at','updated_at'],
 products:['product_id','company_id','file_id','slug','title','short_description','item_category_id','item_subcategory_id','status','is_approve','is_delete'],
 upload_images:['upload_image_id','file'],
 company_info:['company_id','organization_name','organization_slug','company_website','company_email','company_logo'],
});
