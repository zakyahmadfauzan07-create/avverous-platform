import { TryoutPackage } from '@/data/questions';
import { TRYOUT_PACKAGES } from '@/data/questions';

const STORAGE_KEY = 'utbk_packages_v1';

export function loadPackages(): TryoutPackage[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as TryoutPackage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fall through to default
    }
  }
  return JSON.parse(JSON.stringify(TRYOUT_PACKAGES));
}

export function savePackages(packages: TryoutPackage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
}

export function resetPackages(): TryoutPackage[] {
  localStorage.removeItem(STORAGE_KEY);
  return JSON.parse(JSON.stringify(TRYOUT_PACKAGES));
}

export function generatePackageId(existing: TryoutPackage[]): number {
  const maxId = existing.reduce((max, p) => Math.max(max, p.id), 0);
  return maxId + 1;
}

export function createEmptyPackage(id: number): TryoutPackage {
  return {
    id,
    name: `Paket Tryout ${id}`,
    description: 'Paket tryout baru. Tambahkan subtes dan soal untuk paket ini.',
    subtests: [],
  };
}

export function createEmptySubtest(id: number) {
  return {
    id,
    name: 'Subtes Baru',
    shortName: 'NEW',
    description: '',
    durationMinutes: 5,
    questions: [],
  };
}
