import { Test, TestingModule } from '@nestjs/testing';
import { BowlingController } from '../bowling.controller';
import { BowlingService } from '../bowling.service';
import { StartBowlingDto, AddFrameDto, ScoreboardDto } from '../bowling.dto';
import { Bowling } from '../bowling.schema';
import { BadRequestException } from '@nestjs/common';
import { GameStatus } from '../bowling.const';

// Mock data
const mockGame: Bowling = {
  id: '123',
  players: ['Alice', 'Bob'],
  frames: { Alice: [], Bob: [] },
  scores: { Alice: 0, Bob: 0 },
  currentFrame: 1,
  status: GameStatus.IN_PROGRESS,
} as any;

const mockScoreboard: ScoreboardDto = {
  players: {
    Alice: { frames: [], totalScore: 0 },
    Bob: { frames: [], totalScore: 0 },
  },
  currentFrame: 1,
  status: GameStatus.IN_PROGRESS,
};

// Mock BowlingService
const mockBowlingService = {
  startGame: jest.fn(),
  addFrame: jest.fn(),
  getScoreboard: jest.fn(),
};

describe('BowlingController', () => {
  let controller: BowlingController;
  let service: BowlingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BowlingController],
      providers: [
        {
          provide: BowlingService,
          useValue: mockBowlingService,
        },
      ],
    }).compile();

    controller = module.get<BowlingController>(BowlingController);
    service = module.get<BowlingService>(BowlingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startBowling', () => {
    it('should start a new game and return the game ID', async () => {
      const startBowlingDto: StartBowlingDto = { players: ['Alice', 'Bob'] };
      mockBowlingService.startGame.mockResolvedValue(mockGame);

      const result = await controller.startBowling(startBowlingDto);

      expect(service.startGame).toHaveBeenCalledWith(startBowlingDto);
      expect(result).toEqual({ id: '123' });
    });

    it('should throw BadRequestException if service fails', async () => {
      const startBowlingDto: StartBowlingDto = { players: ['Alice'] };
      mockBowlingService.startGame.mockRejectedValue(
        new BadRequestException('Invalid players'),
      );

      await expect(controller.startBowling(startBowlingDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.startGame).toHaveBeenCalledWith(startBowlingDto);
    });
  });

  describe('addFrame', () => {
    it('should add a frame and return the updated game', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Alice', rolls: 'X' };
      const updatedGame: Partial<Bowling> = {
        ...mockGame,
        frames: { Alice: [{ rolls: ['X'], score: 0 }], Bob: [] },
      };
      mockBowlingService.addFrame.mockResolvedValue(updatedGame);

      const result = await controller.addFrame(gameId, addFrameDto);

      expect(service.addFrame).toHaveBeenCalledWith(gameId, addFrameDto);
      expect(result).toEqual(updatedGame);
    });

    it('should throw BadRequestException if service fails', async () => {
      const gameId = '123';
      const addFrameDto: AddFrameDto = { player: 'Charlie', rolls: 'X' };
      mockBowlingService.addFrame.mockRejectedValue(
        new BadRequestException('Player not in game'),
      );

      await expect(controller.addFrame(gameId, addFrameDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.addFrame).toHaveBeenCalledWith(gameId, addFrameDto);
    });
  });

  describe('getScoreboard', () => {
    it('should return the scoreboard for a game', async () => {
      const gameId = '123';
      mockBowlingService.getScoreboard.mockResolvedValue(mockScoreboard);

      const result = await controller.getScoreboard(gameId);

      expect(service.getScoreboard).toHaveBeenCalledWith(gameId);
      expect(result).toEqual(mockScoreboard);
    });

    it('should throw BadRequestException if game not found', async () => {
      const gameId = 'invalid';
      mockBowlingService.getScoreboard.mockRejectedValue(
        new BadRequestException('Game not found'),
      );

      await expect(controller.getScoreboard(gameId)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getScoreboard).toHaveBeenCalledWith(gameId);
    });

    it('should include winner when game is completed', async () => {
      const gameId = '123';
      const completedScoreboard: ScoreboardDto = {
        ...mockScoreboard,
        status: GameStatus.COMPLETED,
        players: {
          Alice: { frames: [{ rolls: ['X'], score: 30 }], totalScore: 168 },
          Bob: { frames: [{ rolls: ['X'], score: 30 }], totalScore: 170 },
        },
        winner: 'Bob',
      };
      mockBowlingService.getScoreboard.mockResolvedValue(completedScoreboard);

      const result = await controller.getScoreboard(gameId);

      expect(service.getScoreboard).toHaveBeenCalledWith(gameId);
      expect(result).toEqual(completedScoreboard);
      expect(result.winner).toBe('Bob');
    });
  });
});
