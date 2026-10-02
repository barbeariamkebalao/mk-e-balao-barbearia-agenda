// setup.js — executa uma vez para configurar o banco
// Uso: node setup.js <SERVICE_ROLE_KEY>
// A service role key está em: Supabase → Settings → API → service_role (secret)

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL     = 'https://iieidvlowaprgewmqxui.supabase.co'
const ANON_KEY         = 'sb_publishable_IPJmki8xqecsdgAh73apVA_gk2LKLGL'
const SERVICE_KEY      = process.argv[2] || ''

if (!SERVICE_KEY) {
  console.log('⚠  Sem service key — só vai criar o usuário admin.')
  console.log('   Para setup completo: node setup.js SUA_SERVICE_ROLE_KEY\n')
}

// Cliente público (para criar o usuário de auth)
const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Cliente admin (para inserir dados ignorando RLS)
const admin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

async function run() {
  // ── 1. Criar usuário admin ──────────────────────────────────────────
  console.log('1/3  Criando usuário admin babi@babilonica.com...')
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: 'babi@babilonica.com',
    password: '123456',
  })

  if (authErr) {
    if (authErr.message.includes('already registered')) {
      console.log('     Usuário já existe — OK ✓')
    } else {
      console.log('     Erro:', authErr.message)
    }
  } else {
    console.log('     Criado com sucesso ✓', authData.user?.email)
    if (authData.session === null) {
      console.log('     ⚠  Confirme o email no Supabase: Authentication → Users → babi@babilonica.com → Confirm')
    }
  }

  if (!admin) {
    console.log('\n⛔  Service key não fornecida — seed e schema devem ser executados manualmente.')
    console.log('    Vá em Supabase → SQL Editor e execute:')
    console.log('    1. schema.sql')
    console.log('    2. seed.sql')
    return
  }

  // ── 2. Verificar se tabela products existe ──────────────────────────
  console.log('\n2/3  Verificando tabelas...')
  const { error: tableErr } = await admin.from('products').select('id').limit(1)
  if (tableErr && tableErr.code === '42P01') {
    console.log('     Tabelas não existem. Execute schema.sql no SQL Editor do Supabase primeiro.')
    console.log('     Depois rode este script novamente.')
    return
  }

  // ── 3. Seed: inserir produtos se tabela estiver vazia ───────────────
  console.log('3/3  Verificando produtos...')
  const { data: existing } = await admin.from('products').select('id').limit(1)

  if (existing && existing.length > 0) {
    console.log('     Produtos já cadastrados — nada a fazer ✓')
  } else {
    console.log('     Inserindo produtos...')
    const { error: seedErr } = await admin.from('products').insert([
      { name: 'Colar Ishtar',    description: 'Colar longo com pingente geométrico em aço inox 316L. 70 cm. Hipoalergênico, resiste à água e ao suor.',        price: 89.90,  category: 'Colares',   images: [], active: true, sort_order: 1  },
      { name: 'Colar Onça',      description: 'Colar curto com corrente mista e pingente animal print em aço inox. Antialérgico, não escurece.',                 price: 74.90,  category: 'Colares',   images: [], active: true, sort_order: 2  },
      { name: 'Colar Plêiades',  description: 'Conjunto de três correntes finas sobrepostas em aço inox escovado. Leveza máxima, inox grau cirúrgico.',         price: 69.90,  category: 'Colares',   images: [], active: true, sort_order: 3  },
      { name: 'Anel Lua',        description: 'Anel aberto ajustável com detalhe crescente lunar em aço inox 316L. Hipoalergênico, tamanho único.',             price: 44.90,  category: 'Anéis',     images: [], active: true, sort_order: 4  },
      { name: 'Anel Tigre',      description: 'Anel largo texturizado em aço inox escovado, inspirado em padrão natural. Resistente, antialérgico.',            price: 54.90,  category: 'Anéis',     images: [], active: true, sort_order: 5  },
      { name: 'Brinco Medusa',   description: 'Brinco de argola em aço inox com detalhe de argola fechada. Solda protegida, não oxida. Hipoalergênico.',        price: 59.90,  category: 'Brincos',   images: [], active: true, sort_order: 6  },
      { name: 'Brinco Star',     description: 'Brinco ear cuff estrela em aço inox com zircônia. Sem furo, pressão lateral. Leveza máxima.',                   price: 49.90,  category: 'Brincos',   images: [], active: true, sort_order: 7  },
      { name: 'Pulseira Nômade', description: 'Pulseira de elos quadrados em aço inox escovado. Fecho de lagosta. Inox 316L grau cirúrgico, não escurece.',    price: 64.90,  category: 'Pulseiras', images: [], active: true, sort_order: 8  },
      { name: 'Pulseira Orion',  description: 'Pulseira rígida com marcações em relevo em aço inox polido. Unissex. Hipoalergênico, resistente à oxidação.',   price: 79.90,  category: 'Pulseiras', images: [], active: true, sort_order: 9  },
      { name: 'Kit Selvagem',    description: 'Colar Ishtar + Brinco Star em aço inox. Embalagem presente Babilônica. 5% de desconto no Pix.',                  price: 129.90, category: 'Kits',      images: [], active: true, sort_order: 10 },
      { name: 'Kit Babilônica',  description: 'Conjunto completo: colar + anel + brincos em aço inox coordenados. Embalagem premium. 5% desconto no Pix.',    price: 189.90, category: 'Kits',      images: [], active: true, sort_order: 11 },
    ])
    if (seedErr) {
      console.log('     Erro no seed:', seedErr.message)
    } else {
      console.log('     11 produtos inseridos ✓')
    }
  }

  // ── 4. Settings ─────────────────────────────────────────────────────
  const { error: settingsErr } = await admin.from('settings').upsert({
    id: 1,
    name: 'Babilônica',
    tagline: 'Joias em Aço Inox · Peças Autorais · Curadoria Ancestral',
    whatsapp: '5511956522793',
    city: 'Piraju — SP',
    currency: 'R$',
    instagram: 'https://www.instagram.com/babilonica7/',
  })
  if (!settingsErr) console.log('     Settings configuradas ✓')

  console.log('\n✅  Setup concluído!')
  console.log('    Login admin: babi@babilonica.com / 123456')
}

run().catch(console.error)
