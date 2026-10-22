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
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
