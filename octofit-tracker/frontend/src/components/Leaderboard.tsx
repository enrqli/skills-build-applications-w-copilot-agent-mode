import { CapabilityCard } from './CapabilityCard.js';
export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      dataKey="leaderboard"
      emptyMessage="No leaderboard scores yet."
      renderItem={(entry, index) => (
        <><strong>{String(entry.rank ?? index + 1)}. {String(entry.teamName ?? 'Team')}</strong><span> - {String(entry.totalPoints ?? 0)} points</span></>
      )}
    />
  );
}
