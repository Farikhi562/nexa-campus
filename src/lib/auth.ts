import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // 1. Tambahkan trustHost agar Auth.js percaya pada domain Vercel/Custom Domain lo
  trustHost: true, 
  providers: [
    Google({
      // 2. Walaupun otomatis, sebaiknya definisikan eksplisit dari env
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  ],
  // 3. Gunakan strategy database untuk sinkronisasi data Prisma yang lebih akurat
  session: { 
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Mapping data dari tabel User Prisma ke objek session NextAuth
        session.user.id = user.id;
        
        // Menambahkan custom field 'tier' ke session agar bisa diakses di client-side
        // @ts-ignore
        session.user.tier = (user as any).tier || 1;
        
        // Tambahkan NPM ke session jika sudah terverifikasi
        // @ts-ignore
        session.user.nim = (user as any).nim || null;
      }
      return session;
    },
  },
  // 4. Tambahkan secret secara eksplisit jika belum ada di env (opsional tapi aman)
  secret: process.env.AUTH_SECRET,
})