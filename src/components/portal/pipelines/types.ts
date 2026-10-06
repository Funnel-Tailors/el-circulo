export interface PipelineSummary {
  key: string;
  label: string;
  id: string;
  stages: { id: string; name: string; count: number; value: number }[];
  total: number;
  open: number;
  won: number;
  lost: number;
  value: number;
}

export interface PipelinesData {
  connected: boolean;
  currency?: string;
  pipelines?: PipelineSummary[];
  by_channel?: { channel: string; label: string; count: number }[];
  updated_at?: string;
}

export interface BoardOpportunity {
  id: string;
  name: string;
  value: number;
  status: "open" | "won" | "lost" | string;
  stage_id: string;
  stage_changed_at: string | null;
  created_at: string | null;
  channel: string;
  contact: { id: string; name: string; email: string | null; phone: string | null; company: string | null };
}

export interface BoardData {
  pipeline: { key: string; label: string; id: string; stages: { id: string; name: string }[] };
  opportunities: BoardOpportunity[];
}

export interface ContactDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  source: string | null;
  tags: string[];
  channel: string;
  created_at: string | null;
  fields: { label: string; text?: string; files?: { name: string; url: string }[] }[];
  notes: { id: string; body: string; created_at: string | null }[];
}

export const CHANNEL_LABELS: Record<string, string> = {
  cold_email: "Cold email", linkedin: "LinkedIn", forms: "Formulario", landing: "Landing", ads: "Paid media", other: "Otros",
};
