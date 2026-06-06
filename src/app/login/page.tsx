import LoginClient from '@/components/LoginClient'

export default function LoginPage({ searchParams }: { searchParams: { mode?: string } }) {
  const mode =
    searchParams.mode === 'signup' || searchParams.mode === 'forgot' ? searchParams.mode : 'login'
  return <LoginClient initialMode={mode} />
}
