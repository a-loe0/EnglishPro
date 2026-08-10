const mockRedis = jest.fn().mockImplementation(() => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  quit: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
  status: 'ready',
}));

export default mockRedis;
