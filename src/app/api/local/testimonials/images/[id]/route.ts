import {parseTestimonialImageId,loadTestimonialImage} from '@/lib/localTestimonialImage';
export const runtime = 'nodejs';
type Context = {params:Promise<{id:string}>};
/** Public image access is limited to image IDs linked to active non-deleted testimonials. */
export async function GET(_request:Request, context:Context){
 const id=parseTestimonialImageId((await context.params).id);
 if(id===null)return Response.json({message:'Invalid image ID.'},{status:400});
 return loadTestimonialImage(id,false);
}
