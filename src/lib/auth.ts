import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Auth.js v5 reads AUTH_SECRET; the project env uses NEXTAUTH_SECRET, so pass it explicitly.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.person.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user) return null
        
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account is temporarily locked. Please try again later.")
        }
        
        const isPasswordValid = await compare(credentials.password as string, user.passwordHash)
        
        if (!isPasswordValid) {
          // Increment failed attempts
          const updatedUser = await prisma.person.update({
            where: { id: user.id },
            data: { failedAttempts: { increment: 1 } }
          })
          
          if (updatedUser.failedAttempts >= 5) {
            // Lock account for 15 minutes
            await prisma.person.update({
              where: { id: user.id },
              data: { 
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
                failedAttempts: 0 
              }
            })
            throw new Error("Too many failed attempts. Account locked for 15 minutes.")
          }
          return null
        }
        
        // Reset failed attempts on success
        if (user.failedAttempts > 0 || user.lockedUntil) {
          await prisma.person.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null }
          })
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  }
})
