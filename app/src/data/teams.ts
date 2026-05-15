/**
 * K리그1 12팀 정보 (2026 시즌)
 * teamId는 K리그 공식 사이트의 ID 체계와 동일 (emblem_KXX.png).
 *
 * 2026 변경사항:
 * - 승격: 인천 유나이티드(K18), 부천 FC 1995(K26)
 * - 강등: 대구(K17), 수원FC(K29)
 */

export interface TeamInfo {
  name: string;        // 짧은 이름 (UI 표시용)
  fullName: string;    // 정식 명칭
  teamId: string;      // K리그 공식 ID (Kxx)
  color: string;       // 메인 컬러 (어두운 톤)
  bgLight: string;     // 배경용 옅은 컬러
  emoji: string;       // 백업용 이모지 (로고 못 불러왔을 때)
  hometown: string;
}

export const TEAMS: Record<string, TeamInfo> = {
  서울:  { name: '서울',  fullName: 'FC 서울',           teamId: 'K09', color: '#000000', bgLight: '#EAEAEA', emoji: '🦁', hometown: '서울' },
  울산:  { name: '울산',  fullName: '울산 HD FC',         teamId: 'K01', color: '#1F4396', bgLight: '#E5EBF6', emoji: '🐯', hometown: '울산' },
  전북:  { name: '전북',  fullName: '전북 현대 모터스',   teamId: 'K05', color: '#006A39', bgLight: '#DCEEE3', emoji: '🚗', hometown: '전주' },
  포항:  { name: '포항',  fullName: '포항 스틸러스',      teamId: 'K03', color: '#E60026', bgLight: '#FBDDE2', emoji: '⚙️', hometown: '포항' },
  강원:  { name: '강원',  fullName: '강원 FC',            teamId: 'K21', color: '#F58220', bgLight: '#FFEEDC', emoji: '⛰️', hometown: '강원' },
  인천:  { name: '인천',  fullName: '인천 유나이티드 FC', teamId: 'K18', color: '#003C8F', bgLight: '#D9E5F4', emoji: '⚓', hometown: '인천' },
  제주:  { name: '제주',  fullName: '제주 SK FC',         teamId: 'K04', color: '#F26522', bgLight: '#FEE6D5', emoji: '🍊', hometown: '제주' },
  안양:  { name: '안양',  fullName: 'FC 안양',            teamId: 'K27', color: '#522F8B', bgLight: '#E6DEEF', emoji: '🐆', hometown: '안양' },
  대전:  { name: '대전',  fullName: '대전 하나 시티즌',   teamId: 'K10', color: '#691F74', bgLight: '#EFE2F2', emoji: '🐬', hometown: '대전' },
  김천:  { name: '김천',  fullName: '김천 상무 FC',       teamId: 'K35', color: '#9E1B32', bgLight: '#F1DDE2', emoji: '🪖', hometown: '김천' },
  부천:  { name: '부천',  fullName: '부천 FC 1995',       teamId: 'K26', color: '#D40029', bgLight: '#FADDE1', emoji: '🦅', hometown: '부천' },
  광주:  { name: '광주',  fullName: '광주 FC',            teamId: 'K22', color: '#E60012', bgLight: '#FBDADD', emoji: '🐦', hometown: '광주' },
};

export const TEAM_NAMES = Object.keys(TEAMS);

/**
 * teamId(K01 등)로부터 팀 이름 찾기.
 * 크롤러 응답이 teamId만 줄 때 사용.
 */
export function getTeamByTeamId(teamId: string): TeamInfo | undefined {
  for (const [, t] of Object.entries(TEAMS)) {
    if (t.teamId === teamId) return t;
  }
  return undefined;
}

/**
 * 팀명을 받아서 정보를 반환.
 * 모르는 팀은 기본값 폴백.
 */
export function getTeam(name: string): TeamInfo {
  return (
    TEAMS[name] || {
      name,
      fullName: name,
      teamId: '',
      color: '#8B95A1',
      bgLight: '#F2F4F6',
      emoji: '⚽',
      hometown: '',
    }
  );
}

/**
 * K리그1 소속 teamId 화이트리스트.
 * 크롤러가 K리그2 선수까지 섞어 보내면 이걸로 필터.
 */
export const K_LEAGUE_1_TEAM_IDS = Object.values(TEAMS).map((t) => t.teamId);
