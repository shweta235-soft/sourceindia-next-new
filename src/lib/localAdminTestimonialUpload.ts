/** Bulk96 safe JPEG/PNG/WebP upload validation. Never trust extensions or client MIME alone. */
import {randomUUID} from 'node:crypto';
export const MAX_TESTIMONIAL_IMAGE_BYTES=3*1024*1024;
const formats=[
 {mime:'image/jpeg',extension:'.jpg',matches:(b:Uint8Array)=>b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
 {mime:'image/png',extension:'.png',matches:(b:Uint8Array)=>b.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n)},
 {mime:'image/webp',extension:'.webp',matches:(b:Uint8Array)=>b.length>=12&&String.fromCharCode(...b.subarray(0,4))==='RIFF'&&String.fromCharCode(...b.subarray(8,12))==='WEBP'},
];
export function testimonialImageFormat(bytes:Uint8Array,reportedMime:string):{mime:string;extension:string}|null{
 if(bytes.length===0||bytes.length>MAX_TESTIMONIAL_IMAGE_BYTES)return null;
 const format=formats.find(f=>f.mime===reportedMime&&f.matches(bytes));
 return format?{mime:format.mime,extension:format.extension}:null;
}
export function testimonialImageFilename(extension:string){
 if(!['.jpg','.png','.webp'].includes(extension))throw new Error('Unsupported format');
 return randomUUID()+extension;
}
export const TESTIMONIAL_UPLOAD_INSERT=`INSERT INTO upload_images (uuid,file,created_at,updated_at) VALUES (?,?,NOW(),NOW())`;
export function testimonialUploadPath(filename:string){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(filename))throw new Error('Unsafe file name');
 return `upload/testimonials/${filename}`;
}
