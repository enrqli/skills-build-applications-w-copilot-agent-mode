import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Activity, Team, User, Workout } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await Promise.all([Activity.deleteMany({}), Team.deleteMany({}), User.deleteMany({}), Workout.deleteMany({})]);
});

describe('leaderboard edge cases', () => {
  it('includes zero-point teams and alphabetically orders equal totals', async () => {
    const [bravo, alpha, delta, charlie] = await Team.create([
      { name: 'Bravo', mascot: 'B' },
      { name: 'Alpha', mascot: 'A' },
      { name: 'Delta', mascot: 'D' },
      { name: 'Charlie', mascot: 'C' },
    ]);
    const [bravoUser, alphaUser] = await User.create([
      { name: 'Bravo User', email: 'bravo@example.com', team: bravo._id, fitnessGoal: 'endurance' },
      { name: 'Alpha User', email: 'alpha@example.com', team: alpha._id, fitnessGoal: 'endurance' },
    ]);
    const occurredAt = new Date('2026-01-01T12:00:00.000Z');
    await Activity.create([
      { user: bravoUser._id, team: bravo._id, type: 'run', minutes: 15, points: 15, occurredAt },
      { user: alphaUser._id, team: alpha._id, type: 'run', minutes: 10, points: 10, occurredAt },
      { user: alphaUser._id, team: alpha._id, type: 'run', minutes: 5, points: 5, occurredAt },
    ]);

    const response = await request(app).get('/api/leaderboard');

    expect(response.status).toBe(200);
    expect(response.body.leaderboard).toEqual([
      { teamName: 'Alpha', totalPoints: 15, rank: 1 },
      { teamName: 'Bravo', totalPoints: 15, rank: 2 },
      { teamName: 'Charlie', totalPoints: 0, rank: 3 },
      { teamName: 'Delta', totalPoints: 0, rank: 4 },
    ]);
  });
});