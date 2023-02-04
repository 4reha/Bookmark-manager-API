import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
    // console.log('PrismaService: ', config.get('DATABASE_URL'));
    // console.log(process.env.DATABASE_URL);
  }
  async resetDb() {
    await this.bookmark.deleteMany({});
    await this.user.deleteMany({});
  }
}
