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

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
