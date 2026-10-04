-- Tabela de lançamentos fiado (atendimento com pagamento a prazo)
CREATE TABLE IF NOT EXISTS public.fiados (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id     uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  client_name   text NOT NULL,
  client_phone  text NOT NULL,
  service_desc  text NOT NULL,
  service_date  date NOT NULL,
  due_date      date NOT NULL,
  amount        numeric(10,2) NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','pago','cancelado')),
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS fiados_barber_id_idx  ON public.fiados(barber_id);
CREATE INDEX IF NOT EXISTS fiados_due_date_idx   ON public.fiados(due_date);
CREATE INDEX IF NOT EXISTS fiados_status_idx     ON public.fiados(status);

-- RLS
ALTER TABLE public.fiados ENABLE ROW LEVEL SECURITY;

-- Barbeiro vê e gerencia apenas seus próprios fiados
CREATE POLICY "fiados_own_barber" ON public.fiados
  FOR ALL USING (
    barber_id IN (
      SELECT id FROM public.barbers WHERE user_id = auth.uid()
    )
  );

-- Admin vê todos
CREATE POLICY "fiados_admin_all" ON public.fiados
  FOR ALL USING ((SELECT public.is_admin()));
