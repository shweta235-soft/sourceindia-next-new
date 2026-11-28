/** Exact column names used by the BULK118 native read-only handlers. */
export const BULK118_TABLES = Object.freeze({
  activities: ['activity_id','uuid','name','coreactivity','status','created_at','updated_at','is_delete'],
  core_activities: ['core_activity_id','uuid','name','color','status','file_id','created_at','updated_at','is_delete'],
  colors: ['color_id','uuid','title','status','created_at','updated_at'],
  faqcategories: ['faqcategory_id','uuid','name','status','created_at','updated_at'],
  company_info: ['activity','core_activity'],
  upload_images: ['upload_image_id','file'],
});
