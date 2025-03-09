import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BowlingController } from './bowling.controller';
import { BowlingService } from './bowling.service';
import { BowlingRepository } from './bowling.repository';
import { Bowling, BowlingSchema } from './bowling.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bowling.name, schema: BowlingSchema }]),
  ],
  controllers: [BowlingController],
  providers: [BowlingService, BowlingRepository],
})
export class BowlingModule {}
