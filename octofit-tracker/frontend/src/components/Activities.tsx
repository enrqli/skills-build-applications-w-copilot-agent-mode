import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadActivities = () => getJson<Record<string, unknown>>('/api/activities');

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loadData={loadActivities}
      dataKey="activities"
      emptyMessage="No activities yet."
      renderItem={(activity) => (
        <><strong>{String(activity.type ?? 'Activity')}</strong><span> - {String(activity.minutes ?? 0)} minutes, {String(activity.points ?? 0)} points</span></>
      )}
    />
  );
}
