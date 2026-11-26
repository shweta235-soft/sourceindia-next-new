/** Read-only INFORMATION_SCHEMA field preflight against the source Sequelize models.
 * No schema changes or data-level SELECT performed. */
export const BULK109_TABLES=Object.freeze({
 users:['user_id','fname','lname','email','mobile','alternate_number','country_code','is_seller','company_id','status','is_approve','is_complete','is_delete','member_role','elcina_member','payment_status','country','state','city','zipcode','website','user_company','walkin_buyer','created_at','updated_at'],
 company_info:['company_id','uuid','organization_name','organization_slug','user_type','role','contact_person','company_phone','company_website','company_email','core_activity','activity','nature_business','designation','is_verified','is_star_seller','featured_company','is_delete','created_at','updated_at'],
 countries:['country_id','name'],states:['state_id','name'],cities:['city_id','name'],
 enquiries:['enquiry_id','uuid','enquiry_number','type','company_id','user_id','buyer_company_id','quantity','description','category','sub_category','category_name','sub_category_name','status','is_delete','name','email','phone','company','is_approve','created_at','updated_at'],
 tickets:['tickets_id','uuid','fname','lname','phone','email','cc_email','ticket_id','user_id','title','message','status','is_complete','priority','category','attachment','created_by','added_by','created_at','updated_at'],
 ticket_categories:['ticket_category_id','name'],
 ticket_replies:['ticket_reply_id','uuid','ticket_id','user_id','reply','added_by','attachment','media_type','created_at','updated_at'],
 buyerenquiry:['buyerenquiry_id','uuid','title','message','user_id','reciever_id','created_at','updated_at'],
 admins:['admin_id','role','status'],
 roles:['role_id','ticket_category']
});
