import { Test, TestingModule } from '@nestjs/testing';
import { BowlingService } from '../bowling.service';
import { BowlingRepository } from '../bowling.repository';
import { Bowling } from '../bowling.schema';
import { StartBowlingDto, AddFrameDto, ScoreboardDto } from '../bowling.dto';
import { BadRequestException } from '@nestjs/common';
import { GameStatus } from '../bowling.const';

// Mock data
const createMockBowling = (): Partial<Bowling> => ({
  id: '123',
  players: ['Alice', 'Bob'],
  frames: { Alice: [], Bob: [] },
  scores: { Alice: 0, Bob: 0 },
  currentFrame: 1,
  status: GameStatus.IN_PROGRESS,
});

const mockUpdatedBowling: Partial<Bowling> = {
  ...createMockBowling(),
  frames: { Alice: [{ rolls: ['X'], score: 0 }], Bob: [] },
};

const mockCompletedFrames: Partial<Bowling> = {
  ...createMockBowling(),
  frames: {
    Alice: [
      { rolls: ['X'], score: 30 },
      { rolls: ['9', '/'], score: 19 },
    ],
    Bob: [
      { rolls: ['X'], score: 30 },
      { rolls: ['9', '/'], score: 20 },
    ],
  },
  scores: { Alice: 168, Bob: 170 },
  currentFrame: 10,
  status: GameStatus.COMPLETED,
};

const mockScoreboard: ScoreboardDto = {
  players: {
    Alice: { frames: [], totalScore: 0 },
    Bob: { frames: [], totalScore: 0 },
  },
  currentFrame: 1,
  status: GameStatus.IN_PROGRESS,
};

// Mock BowlingRepository
const mockBowlingRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

describe('BowlingService', () => {
  let service: BowlingService;
  let repository: BowlingRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BowlingService,
        {
          provide: BowlingRepository,
          useValue: mockBowlingRepository,
        },
      ],
    }).compile();

    service = module.get<BowlingService>(BowlingService);
    repository = module.get<BowlingRepository>(BowlingRepository);
    jest.clearAllMocks();
    mockBowlingRepository.create.mockReset();
    mockBowlingRepository.findById.mockReset();
    mockBowlingRepository.update.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startGame', () => {
    it('should create a new game and return it', async () => {
      const startBowlingDto: StartBowlingDto = { players: ['Alice', 'Bob'] };
      mockBowlingRepository.create.mockResolvedValue(createMockBowling());

      const result = await service.startGame(startBowlingDto);

      expect(repository.create).toHaveBeenCalledWith({
        players: ['Alice', 'Bob'],
        frames: { Alice: [], Bob: [] },
        scores: { Alice: 0, Bob: 0 },
        currentFrame: 1,
        status: GameStatus.IN_PROGRESS,
      });
      expect(result).toEqual(createMockBowling());
    });
  });

  describe('addFrame', () => {
    it('should add a frame and update the game', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Alice', rolls: 'X' };
      mockBowlingRepository.findById.mockResolvedValue(createMockBowling());
      mockBowlingRepository.update.mockResolvedValue(mockUpdatedBowling);

      const result = await service.addFrame(gameId, addFrameDto);

      expect(repository.findById).toHaveBeenCalledWith(gameId);
      expect(repository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          frames: {
            Alice: [{ rolls: ['X'], score: expect.any(Number) }],
            Bob: [],
          },
        }),
      );
      expect(result).toEqual(mockUpdatedBowling);
    });

    it('should throw BadRequestException if game not found', async () => {
      const gameId = 'invalid';
      const addFrameDto: AddFrameDto = { player: 'Alice', rolls: 'X' };
      mockBowlingRepository.findById.mockResolvedValue(null);

      await expect(service.addFrame(gameId, addFrameDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findById).toHaveBeenCalledWith(gameId);
    });

    it('should throw BadRequestException if player not in game', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Charlie', rolls: 'X' };
      mockBowlingRepository.findById.mockResolvedValue(createMockBowling());

      await expect(service.addFrame(gameId, addFrameDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if game completed for player', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Alice', rolls: 'X' };
      const completedPlayerGame = {
        ...createMockBowling(),
        frames: { Alice: Array(10).fill({ rolls: ['X'], score: 0 }), Bob: [] },
      };
      mockBowlingRepository.findById.mockResolvedValue(completedPlayerGame);

      await expect(service.addFrame(gameId, addFrameDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should increment currentFrame when all players have rolled', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Bob', rolls: '8 1' };
      const gameWithOneRoll = {
        ...createMockBowling(),
        frames: { Alice: [{ rolls: ['X'], score: 0 }], Bob: [] },
      };
      const expectedUpdatedGame = {
        ...gameWithOneRoll,
        frames: {
          Alice: [{ rolls: ['X'], score: 0 }],
          Bob: [{ rolls: ['8', '1'], score: 9 }],
        },
        currentFrame: 2,
      };
      mockBowlingRepository.findById.mockResolvedValue(gameWithOneRoll);
      mockBowlingRepository.update.mockResolvedValue(expectedUpdatedGame);

      const result = await service.addFrame(gameId, addFrameDto);

      expect(result.currentFrame).toBe(2);
    });

    it('should set status to completed after 10th frame for all players', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Bob', rolls: 'X 9 /' };
      const gameAtNinth = {
        ...createMockBowling(),
        currentFrame: 10,
        frames: {
          Alice: Array(10).fill({ rolls: ['X'], score: 0 }),
          Bob: Array(9).fill({ rolls: ['X'], score: 0 }),
        },
      };
      const completedGame = {
        ...gameAtNinth,
        frames: {
          Alice: Array(10).fill({ rolls: ['X'], score: 0 }),
          Bob: [
            ...Array(9).fill({ rolls: ['X'], score: 0 }),
            { rolls: ['X', '9', '/'], score: 20 },
          ],
        },
        status: GameStatus.COMPLETED,
      };
      mockBowlingRepository.findById.mockResolvedValue(gameAtNinth);
      mockBowlingRepository.update.mockResolvedValue(completedGame);

      const result = await service.addFrame(gameId, addFrameDto);

      expect(result.status).toBe(GameStatus.COMPLETED);
    });
  });

  describe('getScoreboard', () => {
    it('should return scoreboard for an in-progress game', async () => {
      const gameId = '123';
      mockBowlingRepository.findById.mockResolvedValue(createMockBowling());

      const result = await service.getScoreboard(gameId);

      expect(repository.findById).toHaveBeenCalledWith(gameId);
      expect(result).toEqual(mockScoreboard);
      expect(result.winner).toBeUndefined();
    });

    it('should return scoreboard with winner for a completed game', async () => {
      const gameId = '123';
      mockBowlingRepository.findById.mockResolvedValue(mockCompletedFrames);

      const result = await service.getScoreboard(gameId);

      expect(result.status).toBe(GameStatus.COMPLETED);
      expect(result.winner).toBe('Bob');
      expect(result.players['Alice'].totalScore).toBe(168);
      expect(result.players['Bob'].totalScore).toBe(170);
    });

    it('should throw BadRequestException if game not found', async () => {
      const gameId = 'invalid';
      mockBowlingRepository.findById.mockResolvedValue(null);

      await expect(service.getScoreboard(gameId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseRollsString', () => {
    it('should parse strike correctly', () => {
      const result = service['parseRollsString']('X');
      expect(result).toEqual(['X']);
    });

    it('should parse spare correctly', () => {
      const result = service['parseRollsString']('9/');
      expect(result).toEqual(['9', '/']);
    });

    it('should parse open frame correctly', () => {
      const result = service['parseRollsString']('8 1');
      expect(result).toEqual(['8', '1']);
    });
  });

  describe('validateRolls', () => {
    it('should pass valid strike in frames 1-9', () => {
      expect(() => service['validateRolls'](['X'], false)).not.toThrow();
    });

    it('should pass valid spare in frames 1-9', () => {
      expect(() => service['validateRolls'](['7', '/'], false)).not.toThrow();
    });

    it('should pass valid open frame in frames 1-9', () => {
      expect(() => service['validateRolls'](['5', '4'], false)).not.toThrow();
    });

    it('should throw for too many rolls in frames 1-9', () => {
      expect(() => service['validateRolls'](['5', '4', '1'], false)).toThrow(
        BadRequestException,
      );
    });

    it('should throw for non-strike single roll in frames 1-9', () => {
      expect(() => service['validateRolls'](['5'], false)).toThrow(
        BadRequestException,
      );
    });

    it('should throw for invalid spare in frames 1-9', () => {
      expect(() => service['validateRolls'](['10', '/'], false)).toThrow(
        BadRequestException,
      );
    });

    it('should throw for exceeding 10 pins in frames 1-9', () => {
      expect(() => service['validateRolls'](['6', '5'], false)).toThrow(
        BadRequestException,
      );
    });

    it('should pass valid 10th frame with strike and bonus', () => {
      expect(() =>
        service['validateRolls'](['X', '9', '/'], true),
      ).not.toThrow();
    });

    it('should throw for invalid 3 rolls in 10th frame without strike/spare', () => {
      expect(() => service['validateRolls'](['5', '4', '1'], true)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateTotalScore', () => {
    it('should calculate score for a strike followed by rolls', () => {
      const game = {
        ...createMockBowling(),
        frames: {
          Alice: [
            { rolls: ['X'], score: 0 },
            { rolls: ['9', '/'], score: 0 },
            { rolls: ['8', '1'], score: 0 },
          ],
          Bob: [],
        },
      } as Bowling;
      service['calculateTotalScore'](game, 'Alice');
      expect(game.frames['Alice'][0].score).toBe(20);
      expect(game.frames['Alice'][1].score).toBe(18);
      expect(game.frames['Alice'][2].score).toBe(9);
      expect(game.scores['Alice']).toBe(47);
    });

    it('should calculate 10th frame with strike and bonus', () => {
      const game = {
        ...createMockBowling(),
        frames: {
          Alice: Array(9)
            .fill({ rolls: ['X'], score: 0 })
            .concat([{ rolls: ['X', '9', '/'], score: 0 }]),
          Bob: [],
        },
      } as Bowling;
      service['calculateTotalScore'](game, 'Alice');
      expect(game.frames['Alice'][9].score).toBe(20);
    });
  });
});
