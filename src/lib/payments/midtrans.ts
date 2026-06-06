import 'server-only'
import { createHash } from 'crypto'

export type MidtransConfig = {
  serverKey: string
  isProduction: boolean
}

export function getMidtransConfig(): MidtransConfig | null {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  if (!serverKey) return null
  return {
    serverKey,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  }
}

function snapBaseUrl(isProduction: boolean) {
  return isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
}

export type CreateSnapInput = {
  orderId: string
  amount: number
  itemName: string
  customer: { name?: string | null; email?: string | null }
  finishUrl?: string
}

export async function createSnapTransaction(
  config: MidtransConfig,
  input: CreateSnapInput
): Promise<{ token: string; redirectUrl: string }> {
  const auth = Buffer.from(`${config.serverKey}:`).toString('base64')

  const response = await fetch(snapBaseUrl(config.isProduction), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: [
        { id: input.orderId, price: input.amount, quantity: 1, name: input.itemName.slice(0, 50) },
      ],
      customer_details: {
        first_name: (input.customer.name || 'Mahasiswa NEXA').slice(0, 50),
        email: input.customer.email || undefined,
      },
      credit_card: { secure: true },
      callbacks: input.finishUrl ? { finish: input.finishUrl } : undefined,
    }),
  })

  const data = (await response.json().catch(() => null)) as {
    token?: string
    redirect_url?: string
    error_messages?: string[]
  } | null

  if (!response.ok || !data?.token) {
    const message = data?.error_messages?.join(', ') || 'Gagal membuat transaksi Midtrans.'
    throw new Error(message)
  }

  return { token: data.token, redirectUrl: data.redirect_url ?? '' }
}

// Verifikasi signature webhook: sha512(order_id + status_code + gross_amount + serverKey)
export function verifyMidtransSignature(params: {
  orderId: string
  statusCode: string
  grossAmount: string
  signatureKey: string
  serverKey: string
}): boolean {
  const expected = createHash('sha512')
    .update(params.orderId + params.statusCode + params.grossAmount + params.serverKey)
    .digest('hex')
  return expected === params.signatureKey
}
