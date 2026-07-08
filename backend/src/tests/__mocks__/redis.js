const redisMock = {
  get:       jest.fn().mockResolvedValue(null),
  set:       jest.fn().mockResolvedValue('OK'),
  setex:     jest.fn().mockResolvedValue('OK'),
  del:       jest.fn().mockResolvedValue(1),
  exists:    jest.fn().mockResolvedValue(0),
  duplicate: jest.fn().mockReturnThis(),
  hincrby:   jest.fn().mockResolvedValue(1),
  hget:      jest.fn().mockResolvedValue('0'),
  incr:      jest.fn().mockResolvedValue(1),
  expire:    jest.fn().mockResolvedValue(1),
  on:        jest.fn(),
  connect:   jest.fn(),
  subscribe: jest.fn(),
  publish:   jest.fn(),
  once:      jest.fn(),
};

export default redisMock;
