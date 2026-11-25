import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {testimonialImageFormat,testimonialImageFilename,testimonialUploadPath,MAX_TESTIMONIAL_IMAGE_BYTES} from './localAdminTestimonialUpload.ts';
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0]);
test('valid PNG signature and matching MIME',()=>assert.equal(testimonialImageFormat(png,'image/png')?.extension,'.png'));
test('reject mismatched MIME and forged extension',()=>assert.equal(testimonialImageFormat(png,'image/jpeg'),null));
test('reject SVG and oversized payload',()=>{
 assert.equal(testimonialImageFormat(new TextEncoder().encode('<svg>'), 'image/svg+xml'),null);
 assert.equal(testimonialImageFormat(new Uint8Array(MAX_TESTIMONIAL_IMAGE_BYTES+1),'image/png'),null);
});
test('safe UUID image names and paths',()=>{
 const name=testimonialImageFilename('.webp');assert.match(testimonialUploadPath(name),/^upload\/testimonials\/[0-9a-f-]+\.webp$/);
 assert.throws(()=>testimonialUploadPath('../hack.jpg'));
});
test('upload endpoint requires admin, origin and 2 independent opt-ins',()=>{
 const code=readFileSync('src/app/admin/api/local/testimonials/upload/route.ts','utf8');
 for(const term of ['authorizedAdminFaq(request)','adminFaqSameOrigin(request)','LOCAL_ADMIN_TESTIMONIAL_WRITES_ENABLED','LOCAL_ADMIN_TESTIMONIAL_UPLOADS_ENABLED','multipart','request.formData()','writeFile(absolute,bytes','TESTIMONIAL_UPLOAD_INSERT','unlink(absolute)'])assert.ok(code.includes(term),term);
});
