// Acuerdo de consultoría DFY — texto versionado.
// El hash (SHA-256) del texto se guarda junto a la firma como prueba de qué se firmó.
// Si cambias el texto, sube AGREEMENT_VERSION: las firmas antiguas siguen verificando
// contra su propio hash almacenado.

export const AGREEMENT_VERSION = "v1";

export const AGREEMENT_TEXT = `ACUERDO DE PRESTACIÓN DE SERVICIOS — CONSULTORÍA DFY "EL CÍRCULO"

Emitido por PANCAKES ON SATURDAYS LLC (en adelante, "El Círculo").

1. OBJETO
El Círculo prestará al Cliente un servicio Done-For-You de implantación de su sistema
de adquisición durante un periodo de tres (3) meses. El trabajo abarca, según el caso:
definición de la oferta, definición del cliente ideal (ICP), creación de anuncios,
activación del CRM, montaje del sistema de captación, construcción del embudo, conexión
del embudo con el CRM, grabación de la carta de ventas en vídeo (VSL) y, cuando proceda,
acompañamiento de rebranding.

2. DURACIÓN Y RITMO
El proyecto arranca con una llamada de onboarding (kickoff) en la que se define el plan.
A partir de ahí se trabaja por bloques con ventanas orientativas de aproximadamente dos
semanas cada uno. Los plazos pueden comprimirse o ajustarse de común acuerdo.

3. COLABORACIÓN DEL CLIENTE
El Cliente se compromete a asistir a la llamada de onboarding, a facilitar los accesos,
materiales e información necesarios, y a responder en plazos razonables. Los retrasos del
Cliente pueden desplazar las fechas objetivo sin que ello suponga incumplimiento de
El Círculo.

4. ENTREGABLES Y PORTAL
Los entregables se publican en el portal de cliente a medida que se completan los hitos.
El Cliente accede con las credenciales que recibirá tras la contratación.

5. HONORARIOS Y PAGO
El importe es el indicado en la factura asociada a esta contratación. El servicio se
considera contratado al confirmar el Cliente sus datos y aceptar este acuerdo. La
modalidad de pago es la elegida por el Cliente (enlace de pago o transferencia).

6. RESULTADOS
El Círculo aporta método, ejecución y experiencia probada, pero los resultados dependen
también de factores ajenos a su control (mercado, ejecución del Cliente, presupuesto de
medios). No se garantiza una cifra concreta de facturación ni de resultados.

7. CONFIDENCIALIDAD
Ambas partes tratarán como confidencial la información no pública a la que accedan con
motivo del proyecto.

8. PROTECCIÓN DE DATOS
Los datos de facturación se usan exclusivamente para emitir la factura y gestionar la
relación contractual.

Al marcar "He leído y acepto" y escribir tu nombre completo, declaras tener capacidad
para contratar en nombre de la entidad indicada y aceptas este acuerdo en su totalidad.`;

// SHA-256 hex del texto exacto mostrado (Web Crypto, disponible en el navegador).
export async function getAgreementHash(text: string = AGREEMENT_TEXT): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
