import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bowling } from './bowling.schema';

@Injectable()
export class BowlingRepository {
  constructor(
    @InjectModel(Bowling.name) private bowlingModel: Model<Bowling>,
  ) {}

  async create(bowling: Partial<Bowling>): Promise<Bowling> {
    const game = new this.bowlingModel(bowling);
    return game.save();
  }

  async findById(gameId: string): Promise<Bowling | null> {
    return this.bowlingModel.findById(gameId);
  }

  async update(game: Bowling): Promise<Bowling> {
    return this.bowlingModel
      .findByIdAndUpdate(game._id, game, { new: true })
      .exec();
  }
}
