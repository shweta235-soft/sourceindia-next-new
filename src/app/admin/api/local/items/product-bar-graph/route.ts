import type {NextRequest} from 'next/server';
import {bulk115AdminChart} from '@/lib/localBulk115Admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){return bulk115AdminChart(req,'items','product');}
