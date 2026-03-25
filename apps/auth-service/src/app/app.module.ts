import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { PrismaModule, Helper } from '@performa-edu/libs';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const privateKey = (
          configService.get<string>('JWT_PRIVATE_KEY') || 'your-secret-key'
        ).replace(/\\n/g, '\n');
        const publicKey = (
          configService.get<string>('JWT_PUBLIC_KEY') || 'your-secret-key'
        ).replace(/\\n/g, '\n');
        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256' as const,
            expiresIn: 86400, // 24 hours
          },
          verifyOptions: {
            algorithms: ['RS256' as const],
          },
        };
      },
    }),
    PrismaModule,
    HealthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, Helper],
})
export class AppModule {}
