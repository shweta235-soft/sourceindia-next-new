import type {NextRequest} from 'next/server';
import {listContacts,createContact} from '@/lib/localBulk127Contacts';
export const runtime='nodejs';
export async function GET(){return listContacts();}
export async function POST(req:NextRequest){return createContact(req);}
