import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('BowlingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (POST)', () => {
    return request(app.getHttpServer())
      .post('/bowling/start')
      .expect(201)
      .expect('<the bowling schema>');
  });

  it('/ (PATCH)', () => {
    const id = 1234;
    return request(app.getHttpServer())
      .post('/' + id + '/frame')
      .expect(200)
      .expect('<bowling schema>');
  });

  it('/ (GET)', () => {
    const id = 1234;
    return request(app.getHttpServer())
      .post('/' + id + '/scoreboard')
      .expect(200)
      .expect('<ScoreBoardDto>');
  });
});
