import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { AppDataSource } from './database';
import { User, AuthProvider } from '../models/User';

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!
    },
    async (payload, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: payload.userId }
        });

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/auth/google/callback` : '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('Google OAuth Strategy - Starting authentication');
      console.log('Profile ID:', profile.id);
      console.log('Profile Email:', profile.emails?.[0]?.value);
      console.log('Profile Name:', profile.displayName);
      
      try {
        const userRepository = AppDataSource.getRepository(User);
        
        console.log('Looking for existing user with providerId:', profile.id);
        let user = await userRepository.findOne({
          where: { providerId: profile.id, provider: AuthProvider.GOOGLE }
        });

        if (!user) {
          console.log('User not found, creating new user');
          user = userRepository.create({
            providerId: profile.id,
            provider: AuthProvider.GOOGLE,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value
          });
          await userRepository.save(user);
          console.log('New user created with ID:', user.id);
        } else {
          console.log('Existing user found with ID:', user.id);
          // Update user info
          user.name = profile.displayName;
          user.profilePicture = profile.photos?.[0]?.value || null;
          await userRepository.save(user);
          console.log('User info updated');
        }

        console.log('Google OAuth Strategy - Authentication successful');
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth Strategy - Error:', error);
        console.error('Error stack:', (error as Error).stack);
        return done(error as Error, undefined);
      }
    }
  )
);

// LinkedIn Strategy
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/auth/linkedin/callback` : '/api/auth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        
        let user = await userRepository.findOne({
          where: { providerId: profile.id, provider: AuthProvider.LINKEDIN }
        });

        if (!user) {
          user = userRepository.create({
            providerId: profile.id,
            provider: AuthProvider.LINKEDIN,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value
          });
          await userRepository.save(user);
        } else {
          // Update user info
          user.name = profile.displayName;
          user.profilePicture = profile.photos?.[0]?.value || null;
          await userRepository.save(user);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;



