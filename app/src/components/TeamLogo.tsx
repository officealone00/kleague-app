import { getTeam } from '@/data/teams';

interface Props {
  team: string;
  size?: number;
}

/**
 * 팀 로고
 * 현재는 이모지로만 표시. 향후 K리그 공식 엠블럼 추가 가능.
 */
export default function TeamLogo({ team, size = 28 }: Props) {
  const info = getTeam(team);
  return (
    <span
      style={{
        fontSize: size * 0.9,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
    >
      {info.emoji}
    </span>
  );
}
