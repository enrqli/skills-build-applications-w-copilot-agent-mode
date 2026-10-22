import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

const loadWorkouts = () => getJson<Record<string, unknown>>(
  `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
);

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadData={loadWorkouts}
      dataKey="suggestions"
      emptyMessage="No workout suggestions available."
      renderItem={(workout) => (
        <><strong>{String(workout.title ?? 'Workout')}</strong>{typeof workout.reason === 'string' && <span> - {workout.reason}</span>}</>
      )}
    />
  );
}
