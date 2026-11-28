import type {NextRequest} from 'next/server';
import {deleteContactSelection} from '@/lib/localBulk127Contacts';
export const runtime='nodejs';
export async function DELETE(req:NextRequest){return deleteContactSelection(req);}
