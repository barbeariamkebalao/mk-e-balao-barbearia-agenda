import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { customer, phone, items, total } = req.body

  if (!customer || !phone || !items?.length) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Service key bypasses RLS — only server-side
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data: order, error } = await supabase
    .from('orders')
    .insert({ customer, phone, items, total })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: 'Failed to save order' })
  }

  // WhatsApp Business Cloud API notification
  if (process.env.WA_PHONE_ID && process.env.WA_TOKEN) {
    const body = formatOrderMessage(order)
    try {
      await fetch(
        `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WA_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: process.env.WA_RECIPIENT,
            type: 'text',
            text: { body },
          }),
        }
      )
    } catch (waErr) {
      // WhatsApp failure is non-fatal — order is already saved
      console.error('WhatsApp notification failed:', waErr)
    }
  }

  return res.status(200).json({ ok: true, id: order.id })
}

function formatOrderMessage(order) {
  const lines = Array.isArray(order.items)
    ? order.items.map(i => `  ${i.qty}× ${i.name} — R$ ${Number(i.price * i.qty).toFixed(2).replace('.', ',')}`)
    : []

  return [
    `🛍 Novo pedido #${order.id.slice(0, 8).toUpperCase()}`,
    ``,
    `Cliente: ${order.customer}`,
    `WhatsApp: ${order.phone}`,
    ``,
    `Itens:`,
    ...lines,
    ``,
    `Total: R$ ${Number(order.total).toFixed(2).replace('.', ',')}`,
  ].join('\n')
}
