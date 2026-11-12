import { GET as getProfile, PATCH as patchProfile } from '@/app/api/users/profile/route';

export const dynamic = 'force-dynamic';

export const GET = getProfile;
export const PATCH = patchProfile;
