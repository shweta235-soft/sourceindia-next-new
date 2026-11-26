/** Read-only INFORMATION_SCHEMA contracts; anchored to original Sequelize models. 
 * NewsletterHistories legacy Sequelize primary key is newsletter_history_id;
 * the actual database row identity is separately checked using key metadata.
 */
export const BULK108_TABLES=Object.freeze({
 emails:['email_id','uuid','title','email_for','description','subject','is_seller_direct','message','status','created_at','updated_at'],
 news_latters:['newsletter_id','uuid','title','subject','description','user_type','ip_address','country','location','history_type','city','attachment','is_delete','created_at','updated_at'],
 user_category:['user_category_id','name','status','type','user_type'],
 registrations:['registration_id','uuid','category','name','designation','organization','email','mobile','state','city','is_delete','created_at','updated_at'],
 states:['state_id','name'],
 cities:['city_id','name'],
 upload_images:['upload_image_id','file'],
 news_latter_histories:['user_id','newsLatter_id','is_mail','code','email_view_count','created_at','updated_at'],
 user_activity:['user_activity_id','uuid','user_id','type','is_side','created_at','updated_at'],
 users:['user_id','fname','lname','email','mobile','status','is_seller','is_approve','is_delete','company_id','updated_at'],
 company_info:['company_id','organization_name','organization_slug'],
 category_conflict_logs:['category_conflict_log_id','uuid','source_module','conflict_module','conflict_flow','conflict_name','created_at','updated_at']
});
