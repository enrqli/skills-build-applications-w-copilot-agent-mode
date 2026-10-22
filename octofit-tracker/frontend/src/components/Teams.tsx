import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadTeams = () => getJson<Record<string, unknown>>('/api/teams');

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loadData={loadTeams}
      dataKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => (
        <><strong>{String(team.name ?? 'Team')}</strong>{Array.isArray(team.members) && <span> - {team.members.length} members</span>}</>
      )}
    />
  );
}
