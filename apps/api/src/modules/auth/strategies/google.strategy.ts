import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      // Passport OAuth2 requires a non-empty clientID at construction time.
      // For local dev without Google creds, use placeholder so the app can boot
      // (the /auth/google route will 401 at request time instead).
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'disabled-google-oauth',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'disabled-google-oauth',
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName || 'User';

    if (!email) {
      done(new Error('No email found in Google profile'), undefined);
      return;
    }

    const user = await this.authService.validateOAuthUser({
      email,
      displayName,
      oauthProvider: 'google',
      oauthId: profile.id,
      avatarUrl: profile.photos?.[0]?.value || null,
    });

    done(null, user);
  }
}
