const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : 'your-project.supabase.co'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHostname },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default nextConfig
