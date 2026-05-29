import { createClient } from '@/lib/supabase/client'

export async function logClientError(errorType: string, message: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('error_logs').insert({
      user_id: user?.id ?? null,
      error_type: errorType,
      message: message.slice(0, 1000),
    })
  } catch {
    // Logging must never block the user flow.
  }
}
