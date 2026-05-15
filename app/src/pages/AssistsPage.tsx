import PlayerListPage from '@/components/PlayerListPage';
import { api } from '@/utils/api';

export default function AssistsPage() {
  return (
    <PlayerListPage
      title="도움 순위"
      emoji="🎯"
      primaryLabel="도움"
      primaryKey="assists"
      secondaryLabel="골"
      secondaryKey="goals"
      loadFn={api.assists}
      metaFn={() => api.meta().catch(() => null)}
      emptyMessage="도움 기록이 아직 없어요"
    />
  );
}
