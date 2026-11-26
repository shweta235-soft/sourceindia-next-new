import type {NextRequest} from 'next/server';
import {bulk108ReportHandle} from '@/lib/localBulk108Reports';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk108ReportHandle(req,'user-activity','count');}
