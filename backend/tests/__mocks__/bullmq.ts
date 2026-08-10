export const Queue = jest.fn().mockImplementation(() => ({
  add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  getJob: jest.fn(),
  getJobs: jest.fn().mockResolvedValue([]),
  getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
  close: jest.fn().mockResolvedValue(undefined),
}));

export const Worker = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));

export const QueueEvents = jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
}));

export const Job = jest.fn();
