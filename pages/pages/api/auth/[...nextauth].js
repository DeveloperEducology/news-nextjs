import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb-client";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: { /* ... */ },
      async authorize(credentials) {
        console.log("--- AUTHORIZE (PASSWORD) ---");
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("No user found");
        if (!user.password) throw new Error("Please log in with Google");
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        console.log("Password is valid. Returning user:", user.email, user.role);
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, // Pass the role from authorize
        };
      },
    }),
  ],

  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      console.log("--- JWT CALLBACK ---");
      // The 'user' object is only passed on initial sign-in
      if (user) {
        console.log("User object is present (Sign-in event)");
        token.id = user.id;
        
        // This is a failsafe. We'll check the DB for the role
        // This covers Google logins AND password logins
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email });
        
        if (dbUser) {
          token.role = dbUser.role;
          console.log("Found user in DB. Setting token.role to:", dbUser.role);
        } else {
          console.log("Could not find user in DB to add role.");
        }
      } else {
        console.log("User object is NOT present (Reading from cookie)");
      }
      
      console.log("Returning token:", token);
      return token;
    },
    
    async session({ session, token }) {
      console.log("--- SESSION CALLBACK ---");
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      console.log("Returning session:", session);
      return session;
    },
  },
};

export default NextAuth(authOptions);