import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BowlingModule } from './bowling/bowling.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/bowling',
    ),
    BowlingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
