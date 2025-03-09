import { BadRequestException, Injectable } from '@nestjs/common';
import { BowlingRepository } from './bowling.repository';
import { Bowling } from './bowling.schema';
import {
  AddFrameDto,
  StartBowlingDto,
  ScoreboardDto,
  PlayerScoreDto,
  FrameScoreDto,
} from './bowling.dto';

import {
  SPARE,
  STRIKE,
  MAX_FRAMES,
  MAX_PINS,
  MAX_ROLLS_NORMAL_FRAME,
  MAX_ROLLS_TENTH_FRAME,
  GameStatus,
} from './bowling.const';

@Injectable()
export class BowlingService {
  constructor(private readonly bowlingRepository: BowlingRepository) { }

  async startGame(startGameDto: StartBowlingDto): Promise<Bowling> {
    const game: Partial<Bowling> = {
      players: startGameDto.players,
      frames: Object.fromEntries(startGameDto.players.map((p) => [p, []])),
      scores: Object.fromEntries(startGameDto.players.map((p) => [p, 0])),
      currentFrame: 1,
      status: GameStatus.IN_PROGRESS,
    };
    return this.bowlingRepository.create(game);
  }

  async addFrame(gameId: string, addFrameDto: AddFrameDto): Promise<Bowling> {
    const game = await this.bowlingRepository.findById(gameId);
    if (!game) throw new BadRequestException('Game not found');
    if (!game.players.includes(addFrameDto.player)) {
      throw new BadRequestException('Player not in game');
    }

    const playerFrames = game.frames[addFrameDto.player] || [];
    const isTenthFrame = playerFrames.length === MAX_FRAMES - 1;

    if (playerFrames.length >= MAX_FRAMES) {
      throw new BadRequestException('Game already completed for this player');
    }

    const rollsArray = this.parseRollsString(addFrameDto.rolls);
    this.validateRolls(rollsArray, isTenthFrame);

    playerFrames.push({ rolls: rollsArray, score: 0 });
    game.frames[addFrameDto.player] = playerFrames;

    this.calculateTotalScore(game, addFrameDto.player);

    const allPlayersRolled = game.players.every(
      (p) => (game.frames[p] || []).length >= game.currentFrame,
    );
    if (allPlayersRolled && game.currentFrame < MAX_FRAMES) {
      game.currentFrame += 1;
    } else if (
      game.currentFrame === MAX_FRAMES &&
      game.players.every((p) => (game.frames[p] || []).length === MAX_FRAMES)
    ) {
      game.status = GameStatus.COMPLETED;
    }

    return this.bowlingRepository.update(game);
  }

  async getScoreboard(gameId: string): Promise<ScoreboardDto> {
    const game = await this.bowlingRepository.findById(gameId);
    if (!game) throw new BadRequestException('Game not found');

    const players: Record<string, PlayerScoreDto> = {};
    for (const player of game.players) {
      const frames = game.frames[player] || [];
      players[player] = {
        frames: frames.map(
          (f) =>
            ({
              rolls: f.rolls,
              score: f.score,
            }) as FrameScoreDto,
        ),
        totalScore: game.scores[player],
      };
    }

    const scoreboard: ScoreboardDto = {
      players,
      currentFrame: game.currentFrame,
      status: game.status,
    };

    if (game.status === GameStatus.COMPLETED) {
      let winner = game.players[0];
      let highestScore = game.scores[winner];
      for (const player of game.players) {
        if (game.scores[player] > highestScore) {
          highestScore = game.scores[player];
          winner = player;
        }
      }
      scoreboard.winner = winner;
    }

    return scoreboard;
  }

  private parseRollsString(rolls: string): string[] {
    const trimmed = rolls.trim();
    if (trimmed === STRIKE) return [STRIKE];
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1 && parts[0].endsWith(SPARE)) {
      const firstRoll = parts[0].slice(0, -1);
      return [firstRoll, SPARE];
    }
    return parts;
  }

  private validateRolls(rolls: string[], isTenthFrame: boolean) {
    if (rolls.length > MAX_ROLLS_TENTH_FRAME || (!isTenthFrame && rolls.length > MAX_ROLLS_NORMAL_FRAME)) {
      throw new BadRequestException('Invalid number of rolls');
    }

    if (!isTenthFrame && rolls.length === 1 && rolls[0] !== STRIKE) {
      throw new BadRequestException(
        'Non-strike requires two rolls in frames 1-9',
      );
    }
    if (rolls[1] === SPARE && this.parseRoll(rolls[0]) >= MAX_PINS) {
      throw new BadRequestException('Spare not possible with first roll >= 10');
    }
    if (
      isTenthFrame &&
      rolls.length === MAX_ROLLS_TENTH_FRAME &&
      rolls[0] !== STRIKE &&
      rolls[1] !== SPARE
    ) {
      throw new BadRequestException(
        'Third roll only allowed after strike or spare in 10th frame',
      );
    }
    const totalPins = rolls
      .slice(0, MAX_ROLLS_NORMAL_FRAME)
      .reduce((sum, roll) => sum + this.parseRoll(roll), 0);
    if (!isTenthFrame && totalPins > MAX_PINS) {
      throw new BadRequestException(
        "Total pins in a frame cannot exceed 10 unless it's the 10th frame",
      );
    }
  }

  private calculateTotalScore(game: Bowling, player: string) {
    const frames = game.frames[player] || [];
    let totalScore = 0;

    for (let i = 0; i < frames.length; i++) {
      const rolls = frames[i].rolls;
      let frameScore = 0;

      if (i === MAX_FRAMES - 1) {
        if (rolls[0] === STRIKE) {
          const second = this.parseRoll(rolls[1] || '0');
          const third =
            rolls[2] === SPARE ? MAX_PINS - second : this.parseRoll(rolls[2] || '0');
          frameScore = MAX_PINS + second + third;
        } else if (rolls[1] === SPARE) {
          frameScore = MAX_PINS + this.parseRoll(rolls[2] || '0');
        } else {
          frameScore =
            this.parseRoll(rolls[0]) + this.parseRoll(rolls[1] || '0');
        }
      } else {
        if (rolls[0] === STRIKE) {
          frameScore = MAX_PINS + this.getNextTwoRolls(game, player, i);
        } else if (rolls[1] === SPARE) {
          frameScore = MAX_PINS + this.getNextRoll(game, player, i);
        } else {
          frameScore =
            this.parseRoll(rolls[0]) + this.parseRoll(rolls[1] || '0');
        }
        if (i > 0 && frames[i - 1].rolls[0] === STRIKE) {
          frames[i - 1].score = MAX_PINS + this.getNextTwoRolls(game, player, i - 1);
        }
        if (
          i > 1 &&
          frames[i - 2].rolls[0] === STRIKE &&
          frames[i - 1].rolls[0] === STRIKE
        ) {
          frames[i - 2].score = MAX_PINS + this.getNextTwoRolls(game, player, i - 2);
        }
        if (i > 0 && frames[i - 1].rolls[1] === SPARE) {
          frames[i - 1].score = MAX_PINS + this.getNextRoll(game, player, i - 1);
        }
      }

      frames[i].score = frameScore;
      totalScore += frameScore;
    }

    game.scores[player] = totalScore;
  }

  private parseRoll(roll: string): number {
    return roll === STRIKE ? MAX_PINS : roll === SPARE ? 0 : parseInt(roll) || 0;
  }

  private getNextTwoRolls(
    bowling: Bowling,
    player: string,
    frameIndex: number,
  ): number {
    const frames = bowling.frames[player] || [];
    let rolls: string[] = [];

    for (let i = frameIndex + 1; i < frames.length && rolls.length < 2; i++) {
      rolls = rolls.concat(frames[i].rolls);
    }

    if (rolls.length === 0) return 0;
    if (rolls.length === 1) return this.parseRoll(rolls[0]);

    const first = this.parseRoll(rolls[0]);
    const second = rolls[1] === SPARE ? 10 - first : this.parseRoll(rolls[1]);
    return first + second;
  }

  private getNextRoll(
    bowling: Bowling,
    player: string,
    frameIndex: number,
  ): number {
    const frames = bowling.frames[player] || [];
    for (let i = frameIndex + 1; i < frames.length; i++) {
      return this.parseRoll(frames[i].rolls[0]);
    }
    return 0;
  }
}
