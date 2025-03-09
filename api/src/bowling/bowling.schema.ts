import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Frame {
  @Prop([String])
  rolls?: string[];

  @Prop({ default: 0 })
  score: number;
}

@Schema()
export class Bowling extends Document {
  @Prop({ required: true, type: [String] })
  players: string[];

  @Prop({ required: true, type: Object })
  frames: Record<string, Frame[]>;

  @Prop({ required: true, type: Object })
  scores: Record<string, number>;

  @Prop({ required: true, default: 1 })
  currentFrame: number;

  @Prop({
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
  })
  status: string;
}

export const BowlingSchema = SchemaFactory.createForClass(Bowling);
