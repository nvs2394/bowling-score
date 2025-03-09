import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { GameStatus } from './bowling.const';

export class StartBowlingDto {
  @ApiProperty({
    example: ['Hulk', 'Hawkeye'],
    description: 'List of player names',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 player is required' })
  @ArrayMaxSize(5, { message: 'Maximum 5 players allowed' })
  @IsString({ each: true })
  @MinLength(1, { each: true, message: 'Player name cannot be empty' })
  players: string[];
}

export class AddFrameDto {
  @ApiProperty({ example: 'Hulk', description: 'Player name' })
  @IsString()
  @MinLength(1, { message: 'Player name cannot be empty' })
  player: string;

  @ApiProperty({
    example: 'X',
    description: 'Pins knocked down (X for strike, / for spare, or a number',
  })
  @IsString()
  @MinLength(1, { message: 'At least 1 roll is required' })
  rolls: string;
}

export class FrameScoreDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  rolls: string[];

  @ApiProperty()
  @IsNumber()
  score: number;
}

export class PlayerScoreDto {
  @ApiProperty()
  @IsArray()
  frames: FrameScoreDto[];

  @ApiProperty()
  @IsNumber()
  totalScore: number;
}

export class ScoreboardDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  players: Record<string, PlayerScoreDto>;

  @ApiProperty()
  @IsNumber()
  currentFrame: number;

  @ApiProperty()
  @IsEnum(GameStatus)
  status: GameStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  winner?: string;
}
