import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { BowlingService } from './bowling.service';
import { Bowling } from './bowling.schema';
import { StartBowlingDto, AddFrameDto, ScoreboardDto } from './bowling.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Bowling')
@Controller('bowling')
export class BowlingController {
  constructor(private readonly bowlingService: BowlingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new bowling game' })
  @ApiResponse({
    status: 201,
    description: 'Game started successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async startBowling(
    @Body() startBowlingDto: StartBowlingDto,
  ): Promise<{ id: string }> {
    const game = await this.bowlingService.startGame(startBowlingDto);
    return { id: game.id };
  }

  @Patch(':id/frame')
  @ApiOperation({ summary: 'Submit a frame for a player' })
  @ApiResponse({ status: 200, description: 'Frame recorded successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  addFrame(
    @Param('id') gameId: string,
    @Body() addFrameDto: AddFrameDto,
  ): Promise<Bowling> {
    return this.bowlingService.addFrame(gameId, addFrameDto);
  }

  @Get(':id/scoreboard')
  @ApiOperation({ summary: 'Get score board by game id' })
  @ApiResponse({
    status: 200,
    description: 'Get scoreboard successfully',
    type: ScoreboardDto,
  })
  async getScoreboard(@Param('id') gameId: string): Promise<ScoreboardDto> {
    return this.bowlingService.getScoreboard(gameId);
  }
}
