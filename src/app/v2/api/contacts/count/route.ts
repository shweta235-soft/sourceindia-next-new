import {countContacts} from '@/lib/localBulk127Contacts';
export const runtime='nodejs';
export async function GET(){return countContacts();}
