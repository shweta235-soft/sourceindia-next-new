/** Read-only INFORMATION_SCHEMA checks for BULK119 native GET handlers. */
export const BULK119_TABLES=Object.freeze({
 faqs:['faq_id','uuid','title','description','category','status','is_delete','created_at','updated_at'],
 faqcategories:['faqcategory_id','name','status'],
 seo_pages:['seo_page_id','uuid','title','slug','meta_title','meta_keywords','meta_description','meta_image','created_at','updated_at'],
 testimonials:['testimonial_id','uuid','name','description','status','file_id','is_delete','created_at','updated_at'],
 upload_images:['upload_image_id','file'],
 roles:['role_id','uuid','name','ticket_category','status','is_delete','created_at','updated_at'],
 ticket_categories:['ticket_category_id','name'],
 pages:['page_id','uuid','title','description','is_edit','meta_title','meta_keyword','meta_description','is_delete','created_at','updated_at'],
});
