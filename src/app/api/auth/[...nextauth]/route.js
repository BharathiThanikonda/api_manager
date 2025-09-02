import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "../../../../lib/supabase";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user already exists in our database
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', user.email)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing user:', fetchError);
            return false;
          }

          // If user doesn't exist, create new user record
          if (!existingUser) {
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                {
                  email: user.email,
                  name: user.name,
                  image_url: user.image,
                  provider: 'google',
                  provider_id: profile.sub,
                  last_login: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]);

            if (insertError) {
              console.error('Error creating user:', insertError);
              return false;
            }

            console.log('New user created:', user.email);
          } else {
            // Update last login for existing user
            const { error: updateError } = await supabase
              .from('users')
              .update({
                last_login: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                name: user.name, // Update name in case it changed
                image_url: user.image // Update image in case it changed
              })
              .eq('email', user.email);

            if (updateError) {
              console.error('Error updating user:', updateError);
            }
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
