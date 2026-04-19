import { getTeam } from '@/data/teams';

interface Props {
  team: string;
  size?: number;
}

/**
 * 팀 로고 (이모지 기반 원형 배지)
 * 실제 팀 로고는 저작권 문제로 사용 불가 → 팀 컬러 + 이모지로 표현
 */
export default function TeamLogo({ team, size = 32 }: Props) {
  const info = getTeam(team);
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: info.bgLight,
        border: `1.5px solid ${info.color}`,
        fontSize: size * 0.5,
      }}
    >
      {info.emoji}
    </div>
  );
}
