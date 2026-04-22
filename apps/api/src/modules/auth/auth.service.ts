import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

interface OAuthUserData {
  email: string;
  displayName: string;
  oauthProvider: string;
  oauthId: string;
  avatarUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      displayName: dto.displayName,
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Account is suspended');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateOAuthUser(data: OAuthUserData): Promise<User> {
    let user = await this.usersService.findByEmail(data.email);

    if (!user) {
      // Generate a unique username from email
      const baseUsername = data.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      while (await this.usersService.findByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await this.usersService.createUser({
        email: data.email,
        username,
        displayName: data.displayName,
        oauthProvider: data.oauthProvider,
        oauthId: data.oauthId,
        avatarUrl: data.avatarUrl,
        isVerified: true,
      });
    }

    return user;
  }

  async issueTokens(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
