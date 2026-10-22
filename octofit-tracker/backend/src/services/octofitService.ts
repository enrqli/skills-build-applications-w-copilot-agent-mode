import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const badRequest = (message: string): never => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    badRequest('Activity details are required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) badRequest('A valid userId is required');
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) badRequest('A valid teamId is required');
  if (typeof type !== 'string' || type.trim().length === 0) badRequest('An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    badRequest('Minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) badRequest('The specified user or team does not exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const badRequest = (message: string): never => {
    throw Object.assign(new Error(message), { status: 400 });
  };
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    badRequest('Team details are required');
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0) badRequest('A team name is required');
  if (typeof mascot !== 'string' || mascot.trim().length === 0) badRequest('A team mascot is required');

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: members as string[] | undefined,
  });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((first, second) => second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal?.trim().toLowerCase();
  const activityTypes = activities.map(({ type }) => type.trim().toLowerCase());

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchingActivityCount = activityTypes.filter((type) => type === focus).length;
      const matchesGoal = focus === goal;
      const recentActivity = activityTypes[0];
      const reason = matchingActivityCount > 0
        ? `Matches your recent ${recentActivity} activity${matchesGoal ? ` and ${goal} goal` : ''}.`
        : matchesGoal && recentActivity
          ? `Matches your ${goal} goal and recent ${recentActivity} activity.`
          : matchesGoal
            ? `Matches your ${goal} fitness goal.`
            : recentActivity
              ? `Suggested based on your recent ${recentActivity} activity.`
              : 'Suggested workout.';

      return {
        ...workout,
        reason,
        score: matchingActivityCount + (matchesGoal ? 1 : 0),
      };
    })
    .sort((first, second) => second.score - first.score)
    .map(({ score: _score, ...suggestion }) => suggestion);
}

export { User };
