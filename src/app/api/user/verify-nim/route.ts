import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nim } = await req.json()

    // Validasi format NPM UG: 8 digit angka
    const nimRegex = /^\d{8}$/
    if (!nimRegex.test(nim)) {
      return Response.json({ error: "Format NPM tidak valid. Harus 8 digit angka." }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { nim },
    })

    return Response.json({ success: true, user })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return Response.json({ error: "NPM ini sudah terdaftar di sistem." }, { status: 400 })
    }
    return Response.json({ error: "Terjadi kesalahan server." }, { status: 500 })
  }
}