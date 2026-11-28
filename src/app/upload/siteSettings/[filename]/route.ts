import {serveSettingsQaImage} from '@/lib/localBulk137SettingsUploads';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{filename:string}>}){
 return serveSettingsQaImage((await params).filename);
}
