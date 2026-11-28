import type {NextRequest} from 'next/server';
import {gridContacts} from '@/lib/localBulk127Contacts';
export const runtime='nodejs';
export async function GET(req:NextRequest){return gridContacts(req);}
