/** Columns referenced by Bulk110 analytical/read-only routes; from original Sequelize models. */
export const BULK110_TABLES=Object.freeze({
 users:['user_id','is_seller','status','is_delete','member_role','is_complete','is_approve','created_at','fname','lname','email'],
 categories:['category_id','name','slug','status','is_delete'],
 sub_categories:['sub_category_id','name','slug','category','status','is_delete'],
 seller_messages:['seller_message_id','uuid','user_id','message','created_at','updated_at'],
 designations:['designation_id','uuid','name','status','created_at','updated_at'],
 nature_businesses:['nature_business_id','uuid','name','status','created_at','updated_at'],
 buyer_sourcing_interests:['user_id','item_category_id','item_subcategory_id'],
 item_category:['item_category_id','name'],
 item_subcategory:['item_subcategory_id','name']
});
