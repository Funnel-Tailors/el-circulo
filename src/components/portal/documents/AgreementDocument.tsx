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
 * Documento del acuerdo firmado, on-brand y en Degular (Typekit del dominio),
 * con fondo blanco para imprimir limpio. Clase `print-document` → print-to-PDF.
 */
export const AgreementDocument = ({ agreement }: { agreement: SignedAgreement }) => {
  const text = getAgreementText(agreement.agreement_version);
  const date = agreement.signed_at ? agreement.signed_at.slice(0, 10) : "—";
  return (
    <div className="print-document bg-white text-neutral-900 mx-auto rounded-xl overflow-hidden shadow-2xl" style={{ width: 820, maxWidth: "100%" }}>
      <div className="bg-neutral-950 text-white px-10 py-7 flex items-start justify-between">
        <div>
          <div className="font-display font-black text-2xl tracking-tight">EL CÍRCULO</div>
          <div className="text-[11px] text-neutral-400 mt-1">Consultoría DFY · Acuerdo de prestación de servicios</div>
        </div>
        <div className="text-right text-[11px] text-neutral-300 uppercase tracking-wide">Acuerdo<br /><span className="text-white font-semibold">{agreement.agreement_version || "v"}</span></div>
      </div>

      <div className="px-10 py-8">
        <pre className="whitespace-pre-wrap font-text text-[12px] leading-relaxed text-neutral-800">{text}</pre>

        <div className="mt-8 border-t border-neutral-200 pt-5">
          <div className="text-[9px] font-bold uppercase tracking-wide text-neutral-500 mb-2">Firma electrónica</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]">
            <div><span className="text-neutral-500">Firmado por: </span><span className="font-semibold">{agreement.signer_name}</span></div>
            <div><span className="text-neutral-500">Email: </span>{agreement.signer_email}</div>
            <div><span className="text-neutral-500">Fecha: </span>{date}</div>
            <div><span className="text-neutral-500">IP: </span>{agreement.ip_address || "—"}</div>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 break-all"><span className="uppercase tracking-wide">Hash SHA-256: </span>{agreement.agreement_hash || "—"}</div>
        </div>

        <div className="mt-8 pt-4 border-t border-neutral-200 text-[10px] text-neutral-400">
          PANCAKES ON SATURDAYS LLC · Documento firmado electrónicamente · El Círculo
        </div>
      </div>
    </div>
  );
};
