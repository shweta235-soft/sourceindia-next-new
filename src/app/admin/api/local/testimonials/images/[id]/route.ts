import type {NextRequest} from 'next/server';
import {authorizedAdminFaq,adminFaqResponse} from '@/lib/localAdminFaqAuth';
import {parseTestimonialImageId,loadTestimonialImage} from '@/lib/localTestimonialImage';
export const runtime = 'nodejs';
type Context = {params:Promise<{id:string}>};
/** The admin cookie is scoped to /admin, so admin images use this protected route. */
export async function GET(request:NextRequest,context:Context){
 if(!authorizedAdminFaq(request))return adminFaqResponse({message:'Admin session required.'},401);
 const id=parseTestimonialImageId((await context.params).id);
 if(id===null)return adminFaqResponse({message:'Invalid image ID.'},400);
 return loadTestimonialImage(id,true);
}
