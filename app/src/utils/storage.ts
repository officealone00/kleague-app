/**
 * 즐겨찾기 팀 & 설정 관리 (localStorage)
 */

const KEYS = {
  favoriteTeam: 'kleague-favorite-team',
  hasOnboarded: 'kleague-has-onboarded',
};

export function getFavoriteTeam(): string | null {
  try {
    return localStorage.getItem(KEYS.favoriteTeam);
  } catch {
    return null;
  }
}

export function setFavoriteTeam(team: string | null): void {
  try {
    if (team) localStorage.setItem(KEYS.favoriteTeam, team);
    else localStorage.removeItem(KEYS.favoriteTeam);
  } catch {}
}

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(KEYS.hasOnboarded) === '1';
  } catch {
    return false;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(KEYS.hasOnboarded, '1');
  } catch {}
}
