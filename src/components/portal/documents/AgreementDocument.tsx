import { getAgreementText } from "@/data/consultoriaAgreement";

export interface SignedAgreement {
  signer_name: string;
  signer_email: string;
  signed_at: string | null;
  ip_address: string | null;
  agreement_hash: string | null;
  agreement_version: string | null;
}

/**
 * Documento del acuerdo firmado, on-brand en Degular (Typekit del dominio),
 * fondo blanco para print-to-PDF. Clase `print-document` preservada.
 */
export const AgreementDocument = ({ agreement }: { agreement: SignedAgreement }) => {
  const text = getAgreementText(agreement.agreement_version);
  const date = agreement.signed_at ? agreement.signed_at.slice(0, 10) : "—";

  return (
    <div
      className="print-document bg-white text-neutral-900 mx-auto rounded-2xl overflow-hidden shadow-2xl"
      style={{ width: 820, maxWidth: "100%" }}
    >
      {/* Header negro El Círculo */}
      <div className="bg-neutral-950 text-white px-10 py-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display font-black text-2xl tracking-tight leading-none">EL CÍRCULO</div>
            <div className="text-[11px] text-neutral-400 mt-2 uppercase tracking-[0.15em]">
              Consultoría DFY · Acuerdo de prestación de servicios
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Versión</div>
            <div className="font-display font-black text-lg text-white mt-1">
              {agreement.agreement_version || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Thin accent line */}
      <div className="h-[3px] bg-gradient-to-r from-white via-neutral-400 to-neutral-950" />

      {/* Document body */}
      <div className="px-10 py-10">
        <pre className="whitespace-pre-wrap font-text text-[12.5px] leading-[1.8] text-neutral-700">{text}</pre>

        {/* Signature block */}
        <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
          <div className="px-6 py-3 bg-neutral-900 text-white">
            <span className="text-[10px] font-display font-black uppercase tracking-[0.2em]">Firma electrónica</span>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-[12px]">
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold">Firmado por</div>
                <div className="font-semibold text-neutral-900">{agreement.signer_name}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold">Email</div>
                <div className="text-neutral-700">{agreement.signer_email}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold">Fecha</div>
                <div className="text-neutral-700">{date}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold">IP</div>
                <div className="text-neutral-700">{agreement.ip_address || "—"}</div>
              </div>
            </div>
            {agreement.agreement_hash && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="text-[9px] uppercase tracking-[0.15em] text-neutral-400 font-bold mb-1">Hash SHA-256</div>
                <div className="text-[10px] text-neutral-500 break-all font-mono">{agreement.agreement_hash}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-5 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-[10px] text-neutral-400 uppercase tracking-[0.12em]">
            PANCAKES ON SATURDAYS LLC · El Círculo
          </div>
          <div className="text-[10px] text-neutral-400">
            Documento firmado electrónicamente
          </div>
        </div>
      </div>
    </div>
  );
};
