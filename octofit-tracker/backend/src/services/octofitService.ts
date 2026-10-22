import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function readObject(input: unknown, message: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) badRequest(message);
  return Object.fromEntries(Object.entries(input));
}

function readNonEmptyString(value: unknown, message: string): string {
  if (typeof value !== 'string') badRequest(message);
  const trimmed = value.trim();
  if (trimmed.length === 0) badRequest(message);
  return trimmed;
}

function readObjectId(value: unknown, message: string): string {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) badRequest(message);
  return value;
}

function readPositiveNumber(value: unknown, message: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) badRequest(message);
  return value;
}

function readMemberIds(value: unknown): Types.ObjectId[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((memberId: unknown) => typeof memberId === 'string' && Types.ObjectId.isValid(memberId))) {
    badRequest('Team members must be an array of valid user IDs');
  }
  return value.map((memberId: string) => new Types.ObjectId(memberId));
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const details = readObject(input, 'Activity details are required');
  const userId = readObjectId(details.userId, 'A valid userId is required');
  const teamId = readObjectId(details.teamId, 'A valid teamId is required');
  const type = readNonEmptyString(details.type, 'An activity type is required');
  const minutes = readPositiveNumber(details.minutes, 'Minutes must be a positive number');

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) badRequest('The specified user or team does not exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const details = readObject(input, 'Team details are required');
  const name = readNonEmptyString(details.name, 'A team name is required');
  const mascot = readNonEmptyString(details.mascot, 'A team mascot is required');
  const members = readMemberIds(details.members);

  return Team.create({
    name,
    mascot,
    members,
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
