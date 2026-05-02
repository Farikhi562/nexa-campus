import { auth, signIn, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import NimVerification from "@/components/NimVerification"
import { UG_PORTALS, checkPortalStatus } from "@/lib/portals"
import PortalCard from "@/components/PortalCard"

// Definisikan type status agar konsisten dengan PortalCard
type PortalStatus = "online" | "slow" | "offline";

export default async function HomePage() {
  const session = await auth()
  
  let userData = null
  if (session?.user?.id) {
    userData = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
  }

  // Fetch status portal secara paralel
  const portalsWithStatus = await Promise.all(
    UG_PORTALS.map(async (portal) => {
      const status = await checkPortalStatus(portal.url);
      return {
        ...portal,
        status: status as PortalStatus // Type casting di sini untuk fix error TS2322
      };
    })
  )

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Header Section */}
        <header className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-black tracking-tight text-blue-600">NEXA <span className="text-slate-800">CAMPUS</span></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gunadarma Ecosystem • Tier 1</p>
          </div>

          <div>
            {session ? (
              <form action={async () => { "use server"; await signOut() }} className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold">{session.user?.name}</p>
                  <p className="text-[10px] text-slate-500">{userData?.nim || 'NPM Belum Ada'}</p>
                </div>
                <button type="submit" className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 transition">
                  Logout
                </button>
              </form>
            ) : (
              <form action={async () => { "use server"; await signIn("google") }}>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                  Login with Google
                </button>
              </form>
            )}
          </div>
        </header>

        {session ? (
          <div className="space-y-6">
            {/* NPM Verification Banner */}
            {!userData?.nim && <NimVerification />}

            {/* Grid Utama Dashboard */}
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${!userData?.nim ? 'opacity-40 pointer-events-none' : ''}`}>
              
              {/* Left Column: One-Stop Dashboard */}
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-5 bg-blue-600 rounded-full"></span>
                      One-Stop Dashboard
                    </h3>
                    <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase">Live Sync</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {portalsWithStatus.map((portal) => (
                      <PortalCard key={portal.name} {...portal} />
                    ))}
                  </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-5 bg-purple-600 rounded-full"></span>
                    UG News Feed (AI Categorized)
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">INFO</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Sistem Berhasil Diinisialisasi</p>
                      <p className="text-xs text-slate-500">NEXA Tier 1 Foundation siap digunakan.</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Widgets */}
              <div className="lg:col-span-4 space-y-6">
                {/* Emergency SOS */}
                <section className="bg-red-600 p-6 rounded-2xl shadow-xl shadow-red-200 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <h3 className="font-black text-xl mb-1 uppercase italic">Emergency SOS</h3>
                    <p className="text-red-100 text-xs mb-4">Butuh bantuan medis atau keamanan di kampus?</p>
                    <a 
                      href="https://wa.me/628123456789" 
                      className="block w-full py-3 bg-white text-red-600 text-center font-black rounded-xl hover:bg-red-50 transition uppercase tracking-wider text-sm"
                    >
                      Hubungi Satpam
                    </a>
                  </div>
                </section>

                {/* Wellbeing Widget */}
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-sm">How are you feeling?</h3>
                  <div className="flex justify-between gap-2">
                    {['😢', '😕', '😐', '🙂', '🤩'].map((emoji, idx) => (
                      <button key={idx} className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-lg text-xl transition transform hover:scale-110">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">One App for All.</h2>
             <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">
               Portal terpadu mahasiswa Gunadarma. Ship fast, stay safe.
             </p>
          </div>
        )}
      </div>
    </main>
  )
}