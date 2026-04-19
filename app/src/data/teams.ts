/**
 * K리그1 12개 팀 정보 (2026 시즌)
 * - 디펜딩 챔피언: 전북 현대 (2025 우승)
 * - 승격팀: FC 안양, 부천 FC 1995 (K리그2에서 승격)
 * - 강등팀: 수원 삼성, 수원 FC (K리그2로 강등)
 */

export interface TeamInfo {
  name: string;
  fullName: string;
  color: string;
  bgLight: string;
  emoji: string;
  hometown: string;
  logoUrl: string;
}

export const TEAMS: Record<string, TeamInfo> = {
  전북: { name: '전북', fullName: '전북 현대 모터스', color: '#00703C', bgLight: '#DEF0E6', emoji: '🐉', hometown: '전주', logoUrl: '' },
  울산: { name: '울산', fullName: '울산 HD FC', color: '#0C308E', bgLight: '#E0E7F4', emoji: '🔵', hometown: '울산', logoUrl: '' },
  포항: { name: '포항', fullName: '포항 스틸러스', color: '#FF0000', bgLight: '#FCE0E0', emoji: '⚡', hometown: '포항', logoUrl: '' },
  서울: { name: '서울', fullName: 'FC 서울', color: '#DB0A2D', bgLight: '#FADFE3', emoji: '🦅', hometown: '서울', logoUrl: '' },
  대전: { name: '대전', fullName: '대전 하나 시티즌', color: '#0083B0', bgLight: '#D9EDF3', emoji: '🏛️', hometown: '대전', logoUrl: '' },
  제주: { name: '제주', fullName: '제주 SK FC', color: '#F26522', bgLight: '#FDE3D3', emoji: '🍊', hometown: '제주', logoUrl: '' },
  김천: { name: '김천', fullName: '김천 상무 FC', color: '#8B4513', bgLight: '#EEE0D5', emoji: '⚔️', hometown: '김천', logoUrl: '' },
  강원: { name: '강원', fullName: '강원 FC', color: '#F47920', bgLight: '#FDE5D0', emoji: '🐻', hometown: '강릉', logoUrl: '' },
  광주: { name: '광주', fullName: '광주 FC', color: '#FFD700', bgLight: '#FFF8D6', emoji: '⭐', hometown: '광주', logoUrl: '' },
  인천: { name: '인천', fullName: '인천 유나이티드 FC', color: '#1A4790', bgLight: '#DCE3EF', emoji: '⚓', hometown: '인천', logoUrl: '' },
  안양: { name: '안양', fullName: 'FC 안양', color: '#6F42C1', bgLight: '#E8DEF6', emoji: '🦁', hometown: '안양', logoUrl: '' },
  부천: { name: '부천', fullName: '부천 FC 1995', color: '#CC0033', bgLight: '#FADADF', emoji: '🦊', hometown: '부천', logoUrl: '' },
};

export const TEAM_NAMES = Object.keys(TEAMS);

export function getTeam(name: string): TeamInfo {
  return (
    TEAMS[name] || {
      name,
      fullName: name,
      color: '#8B95A1',
      bgLight: '#F2F4F6',
      emoji: '⚽',
      hometown: '',
      logoUrl: '',
    }
  );
}
