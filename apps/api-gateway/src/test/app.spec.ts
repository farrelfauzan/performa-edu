import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app/app.module';
import request from 'supertest';

describe('Portfolio API', () => {
  let app: INestApplication;
  let server: any;

  async function setup() {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');

    await app.init();
    server = app.getHttpServer();
  }

  beforeAll(async () => {
    await setup();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api', () => {
    it('should return 200 OK', async () => {
      const response = await request(server).get('/api');
      expect(response.status).toBe(200);
    });
  });
});
