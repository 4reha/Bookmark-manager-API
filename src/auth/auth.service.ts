import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { User } from '@prisma/client';
import { PrismaService } from './../prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: AuthDto): Promise<{ access_token: string }> | never {
    const hashedPassword = await argon.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          password: hashedPassword,
        },
      });
      delete user.password;
      return this.signToken(user);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ForbiddenException('credentials already in use');
        }
      }
    }
  }
  async signin(dto: AuthDto): Promise<{ access_token: string }> | never {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    const valid = await argon.verify(user.password, dto.password);
    if (!valid) {
      throw new ForbiddenException('Invalid credentials');
    }
    return this.signToken(user);
  }

  async signToken(user: User): Promise<{ access_token: string }> {
    const payload = {
      username: user.username,
      sub: user.id,
    };
    return {
      access_token: await this.jwt.signAsync(payload, {
        expiresIn: '1d',
        secret: this.config.get('JWT_SECRET'),
      }),
    };
  }
}
