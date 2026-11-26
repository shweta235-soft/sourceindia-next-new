/** Minimum columns needed for the Admin GET/query paths being verified.
 * This is a dependency preflight, not a complete schema migration / parity proof.
 * Identifiers here are static and never originate from untrusted input.
 */
export const BULK105_TABLES=Object.freeze({
 roles:['role_id','uuid','name','ticket_category','status','is_delete','created_at','updated_at'],
 activities:['activity_id','uuid','name','coreactivity','status','is_delete','created_at','updated_at'],
 core_activities:['core_activity_id','uuid','name','color','file_id','status','is_delete','created_at','updated_at'],
 applications:['application_id','uuid','name','cat_file_id','stock_file_id','prefix','status','top_category','is_delete','created_at','updated_at'],
 membership_plans:['membership_plan_id','uuid','name','sub_title','status','price','free','user','enquiries','category','product','is_default','expire_days','is_delete','elcina_plan','created_at','updated_at'],
 interest_sub_categories:['interest_sub_category_id','uuid','name','interest_category_id','status','created_at','updated_at'],
 shortcut_menus:['shortcut_id','uuid','name','link','status','is_delete','created_at','updated_at'],
 contacts:['contact_id','uuid','fname','lname','email','subject','message','is_delete','created_at','updated_at'],
 faqs:['faq_id','title','description','category','status','is_delete','created_at','updated_at'],
 faqcategories:['faqcategory_id','name','status','created_at','updated_at'],
 testimonials:['testimonial_id','name','description','file_id','status','is_delete','created_at','updated_at'],
 upload_images:['upload_image_id','file'],
 front_menu:['front_menu_id','parent_id','name','link','is_show','status','type','position','created_at','updated_at'],
 knowledge_centers:['knowledge_center_id','name','video_url','file_id','status','is_delete','created_at','updated_at'],
 ticket_categories:['ticket_category_id','uuid','name','email','status','created_at','updated_at'],
 interest_categories:['interest_category_id','uuid','name','color','file_id','status','created_at','updated_at'],
 seo_pages:['seo_page_id','uuid','title','slug','meta_title','meta_keywords','meta_description','meta_image','created_at','updated_at'],
 colors:['color_id','uuid','title','status','created_at','updated_at'],
 company_info:['company_id','activity'],
});
export function schemaDiff(required, found){
 const available=new Set(found);
 return required.filter(c=>!available.has(c));
}
