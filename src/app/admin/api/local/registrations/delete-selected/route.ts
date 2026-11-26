import type { NextRequest } from 'next/server';
import {bulk108ContentHandle} from '@/lib/localBulk108Content';
export const runtime='nodejs';
export async function DELETE(req:NextRequest){return bulk108ContentHandle(req,'registrations','deleteSelected');}
