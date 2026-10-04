import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  GiRazor, GiBeard, GiScissors, GiHairStrands,
  GiEyelashes, GiSpray,
} from 'react-icons/gi'
import { FaInstagram, FaMapMarkerAlt, FaClock } from 'react-icons/fa'

/* ── Helpers ── */
const STAR = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const GOLD_STAR = (
  <svg className="w-4 h-4 text-heritage-gold" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

const CHECK_RED = (
  <svg className="w-4 h-4 text-heritage-red/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
)

const ARROW_RIGHT = (
  <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="square" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const SERVICES = [
  {
    icon: <GiRazor className="w-12 h-12" />,
    name: 'Corte Fade',
    price: 'R$ 45',
    desc: 'Degradê impecável, transição suave e acabamento milimétrico na navalha.',
  },
  {
    icon: <GiScissors className="w-12 h-12" />,
    name: 'Corte Social',
    price: 'R$ 40',
    desc: 'O clássico bem alinhado. Perfeito para o ambiente corporativo, mantendo a postura.',
  },
  {
    icon: <GiHairStrands className="w-12 h-12" />,
    name: 'Corte na Tesoura',
    price: 'R$ 50',
    desc: 'Arte manual pura. Construção de formato, caimento e textura personalizados.',
  },
  {
    icon: <GiBeard className="w-12 h-12" />,
    name: 'Barba Clássica',
    price: 'R$ 35',
    desc: 'Ritual com toalha quente, espuma densa, navalha afiada e hidratação com balm.',
  },
  {
    icon: <GiEyelashes className="w-12 h-12" />,
    name: 'Sobrancelha',
    price: 'R$ 15',
    desc: 'Limpeza geométrica na navalha para valorizar o olhar masculino sem perder a naturalidade.',
  },
  {
    icon: <GiSpray className="w-12 h-12" />,
    name: 'Colorimetria',
    price: 'a partir de R$ 80',
    desc: 'Especialistas em platinado ("nevou"), luzes, reflexo alinhado e camuflagem de brancos.',
    highlight: true,
  },
]

const FAQ_ITEMS = [
  {
    q: 'Preciso agendar horário ou posso chegar e cortar?',
    a: 'Nós atendemos preferencialmente com horário marcado para garantir que você não espere e tenha nosso tempo total dedicado. Porém, se houver um encaixe disponível na hora, será um prazer atender.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Aceitamos PIX, cartões de crédito/débito (todas as principais bandeiras) e dinheiro.',
  },
  {
    q: 'Vocês cortam cabelo infantil?',
    a: 'Sim! Temos paciência e técnica para atender as crianças, garantindo um corte estiloso no mesmo padrão MK e Balão.',
  },
]

/* ── Before & After Slider ── */
function BeforeAfter() {
  const wrapRef      = useRef(null)
  const beforeRef    = useRef(null)
  const handleRef    = useRef(null)
  const clipperRef   = useRef(null)
  const [pos, setPos]      = useState(50)
  const dragging           = useRef(false)

  const clamp = (v) => Math.max(0, Math.min(100, v))

  const getPercent = useCallback((clientX) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return 50
    return clamp(((clientX - rect.left) / rect.width) * 100)
  }, [])

  const move = useCallback((clientX) => {
    const p = getPercent(clientX)
    setPos(p)
    if (beforeRef.current)  beforeRef.current.style.width  = `${p}%`
    if (handleRef.current)  handleRef.current.style.left   = `${p}%`
  }, [getPercent])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      const cx = e.touches ? e.touches[0].clientX : e.clientX
      move(cx)
      if (clipperRef.current) {
        clipperRef.current.classList.add('ba-cutting')
        clipperRef.current.classList.remove('ba-idle')
      }
    }
    const onUp = () => {
      dragging.current = false
      if (clipperRef.current) clipperRef.current.classList.remove('ba-cutting')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [move])

  const startDrag = (e) => {
    dragging.current = true
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    move(cx)
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden cursor-ew-resize border border-chalk/15 select-none"
      style={{ aspectRatio: '4/3' }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      {/* DEPOIS (full width, background) */}
      <div className="absolute inset-0">
        <img src="/ba-depois.png" alt="Depois do corte" className="w-full h-full object-cover object-top" draggable="false" />
      </div>

      {/* ANTES (clipped by pos%) */}
      <div ref={beforeRef} className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src="/ba-antes.png" alt="Antes do corte" className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ width: `${100 / (pos / 100)}%`, maxWidth: 'none' }} draggable="false" />
      </div>

      {/* Labels */}
      <span className="absolute top-3.5 left-3.5 z-10 font-sans-condensed text-[10px] uppercase tracking-[0.3em] text-chalk bg-midnight/75 border border-chalk/15 px-2.5 py-1 pointer-events-none">Antes</span>
      <span className="absolute top-3.5 right-3.5 z-10 font-sans-condensed text-[10px] uppercase tracking-[0.3em] text-chalk bg-midnight/75 border border-chalk/15 px-2.5 py-1 pointer-events-none">Depois</span>

      {/* Handle */}
      <div ref={handleRef} className="absolute inset-y-0 z-20 pointer-events-none" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
        <div className="w-0.5 h-full mx-auto" style={{ background: 'rgba(244,244,242,0.7)', boxShadow: '0 0 12px rgba(211,43,47,0.5)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18 flex items-center justify-center">
          <img
            ref={clipperRef}
            src="/maquina.png"
            alt="Máquina"
            className="w-16 h-auto"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(211,43,47,0.4))', transform: 'rotate(90deg)' }}
            draggable="false"
          />
        </div>
      </div>
    </div>
  )
}

/* ── Static fallback gallery — shown until Supabase responds ── */
const STATIC_GALLERY = [
  { id: 'g1', url: '/barbeiro-gabriel.png',       label: 'Fade'   },
  { id: 'g2', url: '/barbeiro-daniel.png',         label: 'Nevou'  },
  { id: 'g3', url: '/ambiente-trabalhando.png',    label: 'Barba'  },
  { id: 'g4', url: '/barbeiro-maikon.png',         label: 'Social' },
]

/* ── Static fallback — shown until Supabase responds ── */
const STATIC_BARBERS = [
  { name: 'MK', slug: 'mk', phone: '5514998989521', avatar_url: '/barbeiro-maikon.png', bio: 'Maikon une a tradição da barbearia com o estilo urbano. Focado em entregar sempre o melhor resultado, com aquele respeito e qualidade impecável.', quote: '"O clássico nunca sai de moda."', speciality: 'Master Barber & Visagista', sort_order: 1 },
  { name: 'BALÃO', slug: 'daniel', phone: '5514996598304', avatar_url: '/barbeiro-daniel.png', bio: 'Daniel construiu sua reputação com muito trabalho, técnica e um atendimento que faz o cliente se sentir em casa. Especialista em degradê limpo e acabamento na régua.', quote: '"Jesus is enough"', speciality: 'Especialista em Colorimetria', sort_order: 2 },
  { name: 'GABRIEL', slug: 'gabriel', phone: '5514998918483', avatar_url: '/barbeiro-gabriel.png', bio: 'Gabriel é o talento da nova geração. Com a mão leve e cortes precisos, ele garante um alinhamento perfeito e a sua autoestima no teto.', quote: '"O detalhe separa o bom do excelente."', speciality: 'Barbeiro Profissional', sort_order: 3 },
]

/* ── Main Component ── */
export default function Home() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)
  const [plans,   setPlans]   = useState([])
  const [barbers, setBarbers] = useState(STATIC_BARBERS)
  const [gallery, setGallery] = useState(STATIC_GALLERY)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.from('plans').select('*').eq('active', true).order('sort_order')
      .then(({ data }) => { if (data?.length) setPlans(data) })
    supabase.from('barbers').select('name,slug,phone,avatar_url,bio,quote,speciality,sort_order')
      .eq('active', true).neq('role', 'admin').order('sort_order')
      .then(({ data }) => { if (data?.length) setBarbers(data) })
    supabase.from('gallery').select('id,url,label,sort_order')
      .eq('active', true).order('sort_order').order('created_at')
      .then(({ data }) => { if (data?.length) setGallery(data) })
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  const goBook = () => navigate('/agendar')

  return (
    <div className="font-sans-body antialiased relative bg-midnight text-chalk">

      {/* Texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* ── NAV ── */}
      <nav className={`fixed w-full z-40 top-0 border-b-classic border-chalk/20 bg-midnight/80 backdrop-blur-md transition-all duration-300 ${scrolled ? 'py-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'py-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <img src="/logo-semfundo.png" alt="MK e BALÃO Barbearia" className="h-12 w-auto object-contain" />
            </div>

            <div className="hidden md:flex items-center space-x-8 font-sans-condensed tracking-widest uppercase text-sm">
              {[['servicos','Serviços'],['sobre','Sobre'],['clube','Clube'],['galeria','Trabalho'],['localizacao','Localização']].map(([id,label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-chalk hover:text-heritage-red transition-colors">{label}</button>
              ))}
              <button onClick={() => navigate('/login')} title="Área Interna"
                className="w-8 h-8 border border-chalk/20 hover:border-heritage-red flex items-center justify-center text-chalk/30 hover:text-heritage-red transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button onClick={goBook} className="group relative px-6 py-2 border-classic border-chalk bg-transparent text-chalk font-bold overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-heritage-red -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 group-hover:text-chalk">Agendar Horário</span>
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="text-chalk hover:text-heritage-red">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t-classic border-chalk/20 bg-midnight absolute w-full">
            <div className="px-4 pt-4 pb-6 space-y-4 font-sans-condensed tracking-widest uppercase text-center">
              {[['servicos','Serviços'],['sobre','Sobre'],['clube','Clube'],['galeria','Trabalho'],['localizacao','Localização']].map(([id,label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-chalk">{label}</button>
              ))}
              <button onClick={goBook} className="w-full mt-4 border-classic border-chalk bg-heritage-red text-chalk px-6 py-3 font-bold">Agendar Horário</button>
              <button onClick={() => navigate('/login')} className="w-full border border-chalk/15 text-chalk/35 py-2 text-[10px] uppercase tracking-[0.3em] hover:text-chalk/60 transition-colors mt-2">Portal Interno</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-heritage-red/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-heritage-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-heritage-red/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(244,244,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,244,242,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute left-4 top-1/4 w-3 h-64 barber-pole-bg opacity-40 hidden lg:block transform -skew-y-12" />
        <div className="absolute right-4 bottom-1/4 w-3 h-64 barber-pole-bg opacity-40 hidden lg:block transform skew-y-12" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center w-full">
          <div className="flex justify-center mb-8 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-heritage-red/20 rounded-full blur-3xl pointer-events-none" />
            <img src="/logo-semfundo.png" alt="MK e BALÃO Barbearia" className="relative z-10 w-72 md:w-96 lg:w-[480px] h-auto object-contain" />
          </div>

          <div className="flex items-center justify-center w-full max-w-3xl mx-auto mb-10">
            <div className="h-px bg-gradient-to-r from-transparent via-chalk/40 to-chalk/40 w-full" />
            <span className="px-6 font-sans-condensed uppercase tracking-widest text-sm text-chalk/70 whitespace-nowrap">O Ritual do Homem Moderno</span>
            <div className="h-px bg-gradient-to-l from-transparent via-chalk/40 to-chalk/40 w-full" />
          </div>

          <p className="font-sans-body text-lg md:text-xl text-chalk/60 max-w-xl mx-auto mb-12 font-light leading-relaxed">
            Fade impecável, tesoura precisa e colorimetria avançada.<br className="hidden md:block" />
            <span className="text-chalk/80">Mais que um corte — mantemos vivas as raízes do ofício.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button onClick={goBook}
              className="inline-flex items-center justify-center border-classic border-chalk bg-heritage-red text-chalk font-sans-condensed uppercase tracking-[0.15em] px-10 py-4 text-lg font-bold cursor-pointer hover:bg-chalk hover:text-midnight transition-colors w-full sm:w-auto shadow-[6px_6px_0px_0px_rgba(244,244,242,0.08)] hover:shadow-[2px_2px_0px_0px_rgba(244,244,242,0.08)] hover:translate-x-1 hover:translate-y-1 duration-200">
              Agendar Agora
            </button>
            <button onClick={() => scrollTo('servicos')}
              className="inline-flex items-center justify-center border-classic border-chalk bg-transparent text-chalk font-sans-condensed uppercase tracking-[0.15em] px-10 py-4 text-lg font-bold cursor-pointer hover:-translate-y-0.5 transition-transform duration-200 w-full sm:w-auto">
              Ver Serviços
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="font-sans-condensed text-[9px] uppercase tracking-[0.3em] text-chalk">Rolar</span>
          <svg className="w-5 h-5 text-chalk" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      {/* ── TICKER ── */}
      <div className="border-y-classic border-chalk bg-heritage-red overflow-hidden py-4">
        <div className="flex whitespace-nowrap font-sans-condensed uppercase tracking-widest text-chalk font-bold text-lg md:text-xl md:justify-center">
          <div className="flex animate-[ticker_20s_linear_infinite] md:animate-none">
            <span className="mx-6">★ 5.0 AVALIAÇÕES</span>
            <span className="mx-6 hidden md:inline">•</span>
            <span className="mx-6">MESA DE SINUCA</span>
            <span className="mx-6 hidden md:inline">•</span>
            <span className="mx-6">DETALHISMO EM CADA CORTE</span>
            <span className="mx-6 hidden md:inline">•</span>
            <span className="mx-6">PIRAJU - SP</span>
            <span className="mx-6 md:hidden">★ 5.0 AVALIAÇÕES</span>
            <span className="mx-6 md:hidden">MESA DE SINUCA</span>
            <span className="mx-6 md:hidden">DETALHISMO EM CADA CORTE</span>
            <span className="mx-6 md:hidden">PIRAJU - SP</span>
          </div>
        </div>
      </div>

      {/* ── SERVIÇOS ── */}
      <section id="servicos" className="py-24 bg-surface relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="font-sans-condensed text-4xl md:text-5xl uppercase tracking-widest text-chalk mb-4">Serviços de Ofício</h3>
            <div className="h-[2px] w-24 bg-heritage-red mx-auto mb-6" />
            <p className="font-sans-body text-chalk/60 max-w-2xl mx-auto">Técnicas clássicas e modernas executadas com maestria. Escolha o seu estilo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((svc, i) => (
              <div key={i} className={`service-card group ${svc.highlight ? 'relative overflow-hidden' : ''}`}>
                {svc.highlight && <div className="absolute right-0 top-0 w-16 h-16 bg-heritage-red/10 rounded-bl-full group-hover:bg-heritage-red/20 transition-colors" />}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="text-heritage-red group-hover:text-chalk transition-colors">
                    {svc.icon}
                  </div>
                  <span className="font-sans-condensed text-xl font-bold text-chalk text-right">{svc.price}</span>
                </div>
                <h4 className="font-sans-condensed text-2xl uppercase tracking-wider text-chalk mb-2 relative z-10">{svc.name}</h4>
                <p className="font-sans-body text-chalk/60 text-sm relative z-10">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Barber Pole Divider ── */}
      <div className="w-full h-4 barber-pole-bg border-y-classic border-chalk" />

      {/* ── EQUIPE ── */}
      <section id="equipe" className="py-24 bg-midnight relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/3">
              <h3 className="font-brush text-5xl md:text-6xl text-chalk mb-4">Resenha Garantida. Técnica Impecável.</h3>
              <h4 className="font-sans-condensed text-2xl uppercase tracking-widest text-heritage-red mb-8">Nossa Filosofia</h4>
              <p className="font-sans-body text-chalk/80 mb-6 text-lg leading-relaxed">
                A MK e BALÃO é onde a resenha é garantida e a sinuca tá sempre pronta. Aqui você relaxa, conecta e esquece o relógio — enquanto o seu corte vai sendo executado com atenção milimétrica a cada detalhe.
              </p>
              <p className="font-sans-body text-chalk/80 mb-8 text-lg leading-relaxed">
                Na <strong>MK e BALÃO</strong>, cada serviço é executado com excelência técnica — do fade ao acabamento na navalha. Não é promessa: é o padrão mínimo de quem senta na nossa cadeira.
              </p>
              <a href="https://www.instagram.com/barbeariamkebalao/" target="_blank" rel="noopener"
                className="inline-flex items-center gap-2 border-b-2 border-heritage-red pb-1 font-sans-condensed uppercase tracking-widest text-chalk hover:text-heritage-red transition-colors">
                Siga nosso trabalho
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
            </div>

            <div className="w-full lg:w-2/3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {barbers.map((b, i) => (
                  <div key={b.slug || i} className={`border-classic border-chalk p-2 bg-surface transform ${i === 1 ? 'sm:translate-y-8' : ''} hover:-translate-y-2 transition-transform duration-500 group relative`}>
                    <div className={`absolute -top-3 -right-3 ${i < 2 ? 'bg-heritage-red text-chalk' : 'bg-chalk text-midnight font-bold'} font-sans-condensed text-[10px] uppercase tracking-widest px-3 py-1 border-classic border-chalk z-10`}>
                      {i < 2 ? 'Fundador' : 'Barbeiro'}
                    </div>
                    <div className="aspect-[3/4] bg-midnight border-classic border-chalk/30 relative overflow-hidden group-hover:border-heritage-red transition-colors">
                      <img src={b.avatar_url || '/logo-escudo.jpg'} alt={b.name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" onError={e => { e.target.src = '/logo-escudo.jpg' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                        <span className="font-brush text-3xl text-chalk block leading-tight drop-shadow-lg">{b.name}</span>
                        <div className="h-px w-10 bg-heritage-red mx-auto my-2" />
                        <span className="font-sans-condensed uppercase text-xs tracking-widest text-chalk/90 font-bold block">{b.speciality}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section id="sobre" className="py-24 bg-surface border-t-classic border-chalk/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-heritage-red/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-heritage-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center mb-20">
            <div className="mb-12 lg:mb-0">
              <p className="font-sans-condensed text-heritage-red uppercase tracking-[0.3em] text-xs mb-4">Quem Somos</p>
              <h3 className="font-brush text-5xl md:text-6xl lg:text-7xl text-chalk leading-tight mb-8">Nossa<br />História</h3>
              <blockquote className="border-l-4 border-heritage-red pl-6">
                <p className="font-brush text-2xl md:text-3xl text-chalk/90 leading-snug">"Aqui cada corte é assinado com qualidade."</p>
                <cite className="font-sans-condensed text-[10px] uppercase tracking-[0.25em] text-heritage-red mt-4 block not-italic">— Fundadores MK e Balão</cite>
              </blockquote>
            </div>
            <div>
              <div className="h-[2px] w-16 bg-heritage-red mb-8" />
              <p className="font-sans-body text-chalk/60 text-base leading-relaxed mb-5">
                A MK e Balão Barbearia nasceu da amizade entre dois barbeiros que acreditavam que uma boa barbearia vai muito além do corte de cabelo. Fundada por <strong className="text-chalk font-semibold">Maikon Dener (MK)</strong> e <strong className="text-chalk font-semibold">Daniel Ferreira (Balão)</strong>, a barbearia cresceu mantendo o mesmo propósito desde o primeiro dia: oferecer um atendimento impecável, valorizar cada detalhe e transformar cada atendimento em um momento de conversa, descontração e cuidado de verdade.
              </p>
              <p className="font-sans-body text-chalk/60 text-base leading-relaxed">
                Hoje, ao lado de <strong className="text-chalk font-semibold">Gabriel Oliveira</strong>, formamos uma equipe comprometida com a evolução constante — acompanhando tendências e aperfeiçoando técnicas sem perder aquilo que sempre fez parte da nossa essência: o <strong className="text-chalk font-semibold">respeito por quem senta na cadeira</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {barbers.map((b, i) => (
              <div key={b.slug || i} className="border-classic border-chalk/20 bg-midnight p-7 hover:border-heritage-red hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)] transition-all duration-300 text-center group flex flex-col">
                <div className="relative w-32 h-32 rounded-full border-classic border-chalk/20 mx-auto mb-5 overflow-hidden group-hover:border-heritage-red transition-colors duration-300 shrink-0">
                  <img src={b.avatar_url || '/logo-escudo.jpg'} alt={b.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" onError={e => { e.target.src = '/logo-escudo.jpg' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-heritage-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                </div>
                <p className={`font-sans-condensed text-[10px] uppercase tracking-widest font-bold mb-1 ${i < 2 ? 'text-heritage-red' : 'text-chalk/40'}`}>
                  {i < 2 ? 'Fundador da Barbearia' : 'Barbeiro'}
                </p>
                <h4 className="font-brush text-3xl text-chalk mb-0.5">{b.name}</h4>
                <p className="font-sans-condensed text-xs uppercase tracking-widest text-chalk/40 mb-4">{b.speciality}</p>
                <p className="font-sans-body text-chalk/60 text-sm leading-relaxed mb-5 flex-1">{b.bio}</p>
                {b.quote && (
                  <blockquote className="border-l-2 border-heritage-red pl-3 text-left mb-5">
                    <p className="font-sans-body text-chalk/40 text-xs italic">{b.quote}</p>
                  </blockquote>
                )}
                {b.phone && (
                  <a href={`https://wa.me/${b.phone}?text=Olá%20${encodeURIComponent(b.name.split(' ')[0])}!%20Quero%20agendar%20um%20horário%20com%20você%20na%20MK%20e%20Balão.`}
                    target="_blank" rel="noopener"
                    className="inline-flex items-center justify-center border-classic border-chalk bg-transparent text-chalk font-sans-condensed uppercase tracking-[0.15em] py-2.5 text-xs w-full group-hover:bg-heritage-red group-hover:border-heritage-red group-hover:text-chalk transition-all duration-300">
                    Agendar com {b.name.split(' ')[0]}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section id="depoimentos" className="py-24 bg-surface border-t-classic border-chalk/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="font-sans-condensed text-4xl md:text-5xl uppercase tracking-widest text-chalk mb-4">A Voz da Bancada</h3>
            <div className="h-[2px] w-24 bg-heritage-red mx-auto mb-6" />
            <p className="font-sans-body text-chalk/60 max-w-2xl mx-auto">Não acredite apenas na nossa palavra. Veja o que quem senta na nossa cadeira tem a dizer.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { init:'M', name:'Marcos V.',  since:'Cliente há 2 anos',   text:'"Melhor degradê de Piraju sem dúvidas. A resenha é sempre garantida, a sinuca sempre pronta e o Balão acertou em cheio no meu platinado. Sou cliente fixo."' },
              { init:'T', name:'Thiago S.',  since:'Avaliação do Google', text:'"Corto com o MK faz tempo e a evolução deles é absurda. Gabriel entrou pro time e manteve o mesmo padrão alto. Não troco por nenhuma outra."' },
              { init:'F', name:'Felipe C.',  since:'Cliente Novo',         text:'"Fiz a barba com toalha quente e foi uma experiência foda. O corte na tesoura do MK tem muita técnica. Estrutura impecável no centro da cidade."' },
            ].map((r, i) => (
              <div key={i} className="border-classic border-chalk/20 bg-midnight p-8 hover:border-heritage-red/50 transition-colors">
                <div className="flex text-heritage-red mb-4">{[...Array(5)].map((_,s) => <span key={s}>{STAR}</span>)}</div>
                <p className="font-sans-body text-chalk/80 italic mb-6">{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-chalk/10 flex items-center justify-center font-sans-condensed font-bold text-chalk">{r.init}</div>
                  <div>
                    <h5 className="font-sans-condensed uppercase tracking-widest text-sm text-chalk">{r.name}</h5>
                    <span className="font-sans-body text-xs text-chalk/50">{r.since}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALERIA ── */}
      <section id="galeria" className="py-24 bg-surface border-y-classic border-chalk/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h3 className="font-sans-condensed text-4xl uppercase tracking-widest text-chalk mb-2">Trabalhos Recentes</h3>
              <p className="font-sans-body text-chalk/60">Direto da nossa cadeira para o seu feed.</p>
            </div>
            <a href="https://www.instagram.com/barbeariamkebalao/" target="_blank" rel="noopener"
              className="mt-4 md:mt-0 flex items-center gap-2 border-classic border-chalk px-6 py-2 hover:bg-chalk hover:text-midnight transition-colors font-sans-condensed uppercase tracking-widest text-sm font-bold">
              <FaInstagram className="w-5 h-5" />
              @barbeariamkebalao
            </a>
          </div>
          <div className={`grid gap-4 ${gallery.length <= 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
            {gallery.map((g) => (
              <div key={g.id} className="aspect-square border-classic border-chalk/30 group relative overflow-hidden">
                <img src={g.url} alt={g.label} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                  <span className="font-sans-condensed uppercase tracking-widest text-sm text-chalk font-bold drop-shadow-lg">{g.label}</span>
                </div>
                <a href="https://www.instagram.com/barbeariamkebalao/" target="_blank" rel="noopener"
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaInstagram className="w-8 h-8 text-chalk drop-shadow-lg" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLUBE ── */}
      <section id="clube" className="py-24 bg-midnight border-t-classic border-chalk/20 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-heritage-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-16">
            <p className="font-sans-condensed text-heritage-red uppercase tracking-[0.3em] text-xs mb-3">Praticidade Pro Seu Mês</p>
            <h3 className="font-brush text-5xl md:text-6xl text-chalk mb-4">Clube MK & Balão</h3>
            <div className="h-[2px] w-24 bg-heritage-red mx-auto mb-6" />
            <p className="font-sans-body text-chalk/60 max-w-xl mx-auto text-sm leading-relaxed">Não quer se preocupar com pagamento toda vez que vier cortar? Assine nossos planos e garanta seu visual em dia, com o melhor custo-benefício e prioridade na agenda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {(plans.length > 0 ? plans : [
              {
                id: 'respeito', name: 'Plano Respeito', tagline: 'O Básico Sempre na Régua.',
                features: ['2 Cortes no mês','1 Barba Completa','1 Sobrancelha','10% OFF em Produtos'],
                cta_text: 'GARANTIR PLANO RESPEITO', cta_phone: '5514996598304',
                cta_message: 'Olá! Gostaria de saber mais sobre o Plano Respeito.', highlight: false,
              },
              {
                id: 'patrao', name: 'Plano Patrão', tagline: 'Presença Marcante o Mês Inteiro.',
                features: ['4 Cortes no mês','Barba inclusa nos atendimentos','Sobrancelha Inclusa','Agendamento Prioritário','20% OFF em Produtos'],
                cta_text: 'GARANTIR PLANO PATRÃO 👑', cta_phone: '5514996598304',
                cta_message: 'Olá! Quero garantir o Plano Patrão!', highlight: true,
              },
            ]).map(plan => {
              const waUrl = `https://wa.me/${plan.cta_phone}?text=${encodeURIComponent(plan.cta_message || '')}`
              return plan.highlight ? (
                <div key={plan.id} className="bg-surface text-left flex flex-col relative overflow-hidden border-classic border-heritage-gold/30 hover:border-heritage-gold hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.6),0_0_40px_rgba(212,175,55,0.12)] transition-all duration-300">
                  <div className="barber-pole-bg h-4 w-full shrink-0" />
                  <div className="p-8 flex flex-col flex-1 relative">
                    <div className="absolute top-4 right-8">
                      <span className="flex items-center gap-1 font-sans-condensed text-[9px] uppercase tracking-[0.2em] bg-heritage-red text-chalk px-2.5 py-1 font-bold">
                        {GOLD_STAR} Presença Forte
                      </span>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-brush text-4xl text-chalk mb-1">{plan.name}</h4>
                      <p className="font-sans-condensed text-[10px] uppercase tracking-[0.2em] text-chalk/40">{plan.tagline}</p>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      {(plan.features || []).map(item => (
                        <li key={item} className="flex items-center gap-3 font-sans-body text-chalk/90 text-sm font-medium">{GOLD_STAR}{item}</li>
                      ))}
                    </ul>
                    <a href={waUrl} target="_blank" rel="noopener"
                      className="inline-flex items-center justify-center border-classic border-chalk bg-heritage-red text-chalk font-sans-condensed uppercase tracking-[0.15em] w-full text-sm py-3 hover:bg-chalk hover:text-midnight transition-colors">
                      {plan.cta_text}
                    </a>
                  </div>
                </div>
              ) : (
                <div key={plan.id} className="border-classic border-chalk/20 bg-surface p-8 text-left hover:border-heritage-red hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col">
                  <div className="mb-6">
                    <h4 className="font-brush text-4xl text-chalk mb-1">{plan.name}</h4>
                    <p className="font-sans-condensed text-[10px] uppercase tracking-[0.2em] text-chalk/40">{plan.tagline}</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {(plan.features || []).map(item => (
                      <li key={item} className="flex items-center gap-3 font-sans-body text-chalk/70 text-sm">{CHECK_RED}{item}</li>
                    ))}
                  </ul>
                  <a href={waUrl} target="_blank" rel="noopener"
                    className="inline-flex items-center justify-center border-classic border-chalk bg-transparent text-chalk font-sans-condensed uppercase tracking-[0.15em] w-full text-sm py-3 hover:bg-heritage-red hover:border-heritage-red transition-all duration-300">
                    {plan.cta_text} {ARROW_RIGHT}
                  </a>
                </div>
              )
            })}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-sans-condensed uppercase tracking-[0.2em] text-xs text-chalk/30">
              Dúvidas sobre os planos?{' '}
              <a href="https://wa.me/5514996598304" target="_blank" rel="noopener" className="text-heritage-red hover:text-chalk transition-colors underline ml-1">Chame a gente no Zap</a>
            </p>
            <button onClick={goBook} className="font-sans-condensed uppercase tracking-widest text-xs text-chalk/30 hover:text-heritage-red transition-colors flex items-center gap-2 group">
              Já é assinante? Agende com prioridade
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── LOCALIZAÇÃO ── */}
      <section id="localizacao" className="py-24 bg-midnight relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div>
              <h3 className="font-sans-condensed text-4xl uppercase tracking-widest text-chalk mb-8">Nossa Base</h3>
              <div className="space-y-8">
                {/* Endereço */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 border-classic border-chalk p-2 bg-heritage-red shrink-0">
                    <FaMapMarkerAlt className="w-6 h-6 text-chalk" />
                  </div>
                  <div>
                    <h4 className="font-sans-condensed text-xl uppercase tracking-widest text-chalk mb-1">Endereço</h4>
                    <p className="font-sans-body text-chalk/70">Praça Ataliba Leonel, 200 – Centro<br />Piraju, SP</p>
                  </div>
                </div>

                {/* Horários */}
                <div className="flex items-start gap-4">
                  <div className="mt-1 border-classic border-chalk p-2 bg-surface shrink-0">
                    <FaClock className="w-6 h-6 text-chalk" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-sans-condensed text-xl uppercase tracking-widest text-chalk mb-3">Horário de Funcionamento</h4>
                    <table className="w-full font-sans-body text-sm">
                      <tbody>
                        <tr className="border-b border-chalk/10">
                          <td className="py-2 text-chalk/60">Segunda a Sexta</td>
                          <td className="py-2 text-chalk font-semibold text-right">09:00 – 19:00</td>
                        </tr>
                        <tr className="border-b border-chalk/10">
                          <td className="py-2 text-chalk/60">Sábado</td>
                          <td className="py-2 text-chalk font-semibold text-right">09:00 – 20:00</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-chalk/40">Domingo</td>
                          <td className="py-2 text-chalk/40 text-right">Fechado</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <button onClick={goBook}
                className="inline-flex items-center justify-center border-classic border-chalk bg-heritage-red text-chalk font-sans-condensed uppercase tracking-[0.15em] px-8 py-3 text-lg font-bold cursor-pointer hover:bg-chalk hover:text-midnight transition-colors mt-10 w-full md:w-auto">
                Marcar Horário
              </button>
            </div>

            {/* Mapa placeholder */}
            <div className="relative w-full border-classic border-chalk bg-[#111] overflow-hidden flex flex-col items-center justify-center p-6 text-center"
              style={{ aspectRatio:'4/3', backgroundImage:'linear-gradient(rgba(244,244,242,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(244,244,242,0.05) 1px,transparent 1px)', backgroundSize:'20px 20px' }}>
              <FaMapMarkerAlt className="w-16 h-16 text-heritage-red mb-4 animate-bounce z-10" />
              <h4 className="font-sans-condensed text-2xl uppercase tracking-widest text-chalk mb-2 z-10">Praça Ataliba Leonel, 200</h4>
              <p className="font-sans-body text-chalk/60 mb-6 z-10">Centro, Piraju - SP</p>
              <a href="https://maps.google.com/?q=Praça+Ataliba+Leonel,+200+-+Centro,+Piraju" target="_blank" rel="noopener"
                className="inline-flex items-center justify-center border-classic border-chalk bg-transparent text-chalk font-sans-condensed uppercase tracking-[0.15em] px-6 py-2 text-sm hover:bg-chalk hover:text-midnight transition-colors z-10">
                Abrir no GPS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANTES & DEPOIS ── */}
      <section id="interativo" className="py-20 bg-midnight">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="font-sans-condensed text-heritage-red uppercase tracking-[0.3em] text-xs mb-3">Experimente</p>
            <h2 className="font-brush text-4xl md:text-5xl text-chalk leading-tight">
              Antes <span className="text-heritage-red">&</span> Depois
            </h2>
            <p className="font-sans-body text-chalk/50 mt-4 text-sm">Arraste a máquina e veja a transformação</p>
          </div>
          <BeforeAfter />
          <p className="text-center font-sans-condensed text-chalk/25 uppercase tracking-widest text-[10px] mt-5">
            Clique e arraste para revelar o corte ✂
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-surface border-t-classic border-chalk/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="font-sans-condensed text-4xl uppercase tracking-widest text-chalk mb-4">Dúvidas Frequentes</h3>
            <div className="h-[2px] w-24 bg-heritage-red mx-auto" />
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-classic border-chalk/20 bg-midnight overflow-hidden">
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left focus:outline-none hover:bg-chalk/5 transition-colors">
                  <span className="font-sans-condensed uppercase tracking-widest text-chalk font-bold pr-4">{item.q}</span>
                  <svg className={`w-5 h-5 text-heritage-red shrink-0 transition-transform duration-300 ${faqOpen === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div style={{ maxHeight: faqOpen === i ? '200px' : '0', opacity: faqOpen === i ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease' }}>
                  <p className="font-sans-body text-chalk/70 px-6 pb-4 text-sm">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#050505] border-t-classic border-chalk pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 text-center md:text-left">
            <img src="/logo-escudo.jpg" alt="MK e BALÃO" className="h-20 w-auto object-contain mx-auto md:mx-0" />
            <div className="flex flex-wrap justify-center gap-6 font-sans-condensed uppercase tracking-widest text-sm">
              {[['servicos','Serviços'],['sobre','Sobre'],['clube','Clube'],['galeria','Galeria']].map(([id,label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-chalk/70 hover:text-heritage-red transition-colors">{label}</button>
              ))}
              <button onClick={() => navigate('/login')} className="text-chalk/25 hover:text-chalk/60 transition-colors">
                Área do Barbeiro
              </button>
            </div>
            <a href="https://www.instagram.com/barbeariamkebalao/" target="_blank" rel="noopener"
              className="h-12 w-12 border-classic border-chalk/30 flex items-center justify-center text-chalk hover:border-heritage-red hover:text-heritage-red transition-colors rounded-full">
              <FaInstagram className="w-5 h-5" />
            </a>
          </div>
          <div className="border-t-classic border-chalk/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-sans-condensed uppercase tracking-widest text-chalk/40">
            <p>© {new Date().getFullYear()} MK e BALÃO Barbearia. Todos os direitos reservados.</p>
            <a href="https://fluencyworks.com.br" target="_blank" rel="noopener"
              className="mt-2 md:mt-0 hover:text-chalk/70 transition-colors">
              Criado pela Fluency Works
            </a>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp FAB ── */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        <button onClick={goBook}
          className="relative w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label="Agendar">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </button>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-midnight border border-chalk/20 text-chalk font-sans-condensed text-xs uppercase tracking-widest px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Agendar no Zap
        </span>
      </div>
    </div>
  )
}
