-- OTP verification for El Círculo lead form (anti-troll).
-- Source of truth for verifying the 6-digit code sent via WhatsApp (GHL automation).
create table if not exists public.circulo_otp_verifications (
  id uuid primary key default gen_random_uuid(),
  contact_id text,
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_circulo_otp_phone on public.circulo_otp_verifications (phone);
create index if not exists idx_circulo_otp_contact on public.circulo_otp_verifications (contact_id);
create index if not exists idx_circulo_otp_created on public.circulo_otp_verifications (created_at desc);

-- RLS on with NO policies → only the service role (edge functions) can read/write.
alter table public.circulo_otp_verifications enable row level security;
