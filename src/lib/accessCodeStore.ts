import { supabase } from '@/lib/supabase';

export interface AccessCodeRow {
  package_id: number;
  package_name: string;
  access_code: string;
  updated_at: string;
}

export interface PackageWithCode {
  packageId: number;
  packageName: string;
  hasCode: boolean;
  accessCode: string | null;
  updatedAt: string | null;
}

function tidy<T>(payload: { data: T | null; error: { message: string } | null }): T {
  if (payload.error) throw new Error(payload.error.message);
  return payload.data as T;
}

export async function fetchAccessCodes(): Promise<AccessCodeRow[]> {
  const data = tidy(
    await supabase
      .from('tryout_access_codes')
      .select('package_id, package_name, access_code, updated_at')
      .order('package_id', { ascending: true }),
  );
  return data ?? [];
}

export async function upsertAccessCode(packageId: number, packageName: string, code: string): Promise<void> {
  const { error } = await supabase
    .from('tryout_access_codes')
    .upsert(
      { package_id: packageId, package_name: packageName, access_code: code.trim() },
      { onConflict: 'package_id' },
    );
  if (error) throw new Error(error.message);
}

export async function deleteAccessCode(packageId: number): Promise<void> {
  const { error } = await supabase.from('tryout_access_codes').delete().eq('package_id', packageId);
  if (error) throw new Error(error.message);
}

export async function verifyTryoutCode(packageId: number, code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_tryout_code', {
    p_package_id: packageId,
    p_code: code,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}
