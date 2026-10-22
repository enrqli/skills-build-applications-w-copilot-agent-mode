import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadLeaderboard = () => getJson<Record<string, unknown>>('/api/leaderboard');

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loadData={loadLeaderboard}
      dataKey="leaderboard"
      emptyMessage="No leaderboard scores yet."
      renderItem={(entry, index) => (
        <><strong>{String(entry.rank ?? index + 1)}. {String(entry.teamName ?? 'Team')}</strong><span> - {String(entry.totalPoints ?? 0)} points</span></>
      )}
    />
  );
}
