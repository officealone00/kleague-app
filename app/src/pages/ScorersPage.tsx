import PlayerListPage from '@/components/PlayerListPage';
import { api } from '@/utils/api';

export default function ScorersPage() {
  return (
    <PlayerListPage
      title="득점 순위"
      emoji="⚽"
      primaryLabel="골"
      primaryKey="goals"
      secondaryLabel="도움"
      secondaryKey="assists"
      loadFn={api.scorers}
      metaFn={() => api.meta().catch(() => null)}
      emptyMessage="득점 기록이 아직 없어요"
    />
  );
}
