// Carta de ventas del lead magnet (/), editable desde /admin/carta.
// Se guarda en app_settings.carta_blocks como una lista de bloques.
//
// Marcado inline dentro de los textos:
//   __texto__  → subrayado (ideas clave)
//   *texto*    → itálica (tono y apartes)

export type CartaBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "p"; text: string }
  | { id: string; type: "strong"; text: string }
  | { id: string; type: "list"; items: string[] }
  | { id: string; type: "form"; source: string }
  | { id: string; type: "videos" }
  | { id: string; type: "screenshots" };

export type CartaBlockType = CartaBlock["type"];

export const CARTA_SETTINGS_KEY = "carta_blocks";

export const BLOCK_LABELS: Record<CartaBlockType, string> = {
  heading: "Titular",
  p: "Párrafo",
  strong: "Párrafo destacado",
  list: "Lista",
  form: "Formulario",
  videos: "Testimonios en vídeo",
  screenshots: "Testimonios en pantallazo",
};

export const newBlock = (type: CartaBlockType): CartaBlock => {
  const id = crypto.randomUUID();
  switch (type) {
    case "list":
      return { id, type, items: [""] };
    case "form":
      return { id, type, source: `carta_${id.slice(0, 6)}` };
    case "videos":
    case "screenshots":
      return { id, type };
    default:
      return { id, type, text: "" };
  }
};

let n = 0;
const p = (text: string): CartaBlock => ({ id: `d${n++}`, type: "p", text });
const list = (items: string[]): CartaBlock => ({ id: `d${n++}`, type: "list", items });

export const CARTA_DEFAULT_BLOCKS: CartaBlock[] = [
  { id: "d-h1", type: "heading", text: "No te parece *injusto*?" },
  p("Quiero decir."),
  p("Eres __un soplo de calidad en un sector mediocre__ lleno de servicios basura que el *“entrepreneur”* medio dice que va a desaparecer por culpa de la IA."),
  p("Una __aguja de oro en un pajar__ en el que cada hebra se genera con chatgpt creando una *amalgama de mediocridad infumable*. Digo."),
  p("Y aún así __no paras de compararte__ con otra gente de tu sector que __firma los clientes que tu no consigues__ pese a ser *no-tan-buenos*, eh?"),
  p("Por mucho que entre una crisis y la siguiente en la que __te planteas si has elegido la opción correcta a la que dedicarte__ te entren *arrebatos de hacer contenido*, o lo que sea que te haya dicho el gurú de turno."),
  p("Pero mañana suena el despertador y el mundo sigue girando y __tu agenda sigue vacía y tu cuenta temblando__."),
  p("Todo mientras la fecha del trimestre o de la cuota de autónomos avanza *inexorable*."),
  p("*Jo-der.*"),
  p("Puede que en algún momento hayas pensado cosas como que *la gente no paga*."),
  p("Que - *inserte sector aquí* - está fatal."),
  p("Que la gente a la que va bien tiene *mucha suerte* o *mucho privilegio* o está *enchufado por nosequién*."),
  p("Pero si buscas a alguien que te de la razón…"),
  p("__Aquí no es.__"),
  p("No seré yo quien legitime a *la industria más llorona que he conocido jamás*."),
  p("Ahora bien…"),
  p("Si eres un poco más *espabilati con tomati* y has entendido que __debe haber “algo” que se te escapa__ para que haya agencias que se aprovechan del trabajo de pobres diablos (*como tú*))"),
  p("“Algo” que hace que __cierran proyectos millonarios__ mientras se nutren del trabajo de gente buena pero irrelevante a la que le pagan *un 1% de lo que ganan*…"),
  p("“Algo” que hace que __clientes con pasta__ y con muy pocas ganas de darte chapas interminables por whatsapp __estén deseando trabajar contigo__. (*aunque no seas el más barato*)"),
  p("“Algo” que sabe la gente que __cobra por adelantado__ sin tener que lidiar con retrasos ni *cincuentaporcientos* a la entrega del proyecto que se alarga más de lo que tenías previsto."),
  p("“Algo”, *maifren*, que puedes aprender __completamente gratis__ si cumples dos condiciones que todo hijo de vecino podría:"),
  list([
    "La primera, que encadenes las neuronas suficientes para prestar __35 minutos de atención__ a un video que voy a mandar directo a tu correo (*y que no encontrarás en ningún otro sitio*)",
    "La segunda, que __me dejes aquí abajo tu correo__.",
  ]),
  { id: "d-form1", type: "form", source: "carta_condiciones" },
  p("Y es que te voy a ser honesto, __ese algo funciona__."),
  p("Funcionó para que Nico pasara de __cobrar 200€ por una web a cobrar los 4000__ que pide ahora (*cerrando varios proyectos cada mes*)"),
  p("Funcionó también para que Diego, que venía *temeroso de cobrar 100 eurillos* por un video y encadenaba excusas, encadene proyectos ahora por los que __le pagan 4 cifras__ (*2.200€ por el último*)"),
  p("O para que Cris o Cynthia o un montón de gente entendiera cómo hacer que la gente __les pagara más de 3000 euros__ por lo que hacían."),
  p("Pero esto no va de mi"),
  p("*No, no.*"),
  p("Va de __lo que hagas tú hoy__ para estar en la lista interminable de gente que ha conseguido __multiplicar sus precios__ y que puedes ver aquí abajo."),
  p("De lo que __llevas haciendo mal puede que años__ y que te mantiene *tieso como una rata atropellada hace dos semanas en la autovía*."),
  p("Cosas como:"),
  list([
    "Decir *gracias por la oportunidad*.",
    "__Mandar propuestas y presupuestos__",
    "__Borrar el precio__ al final de esas propuestas y presupuestos *15 veces* hasta llegar a una cifra lo suficientemente baja como para asegurarte de que si te aceptan el proyecto, *es una putada*.",
    "Pensar que lo que quieres es dar __un servicio recurrente__ para asegurar (*pusi*)",
    "__Crear contenido__ (*que se te da fatal*) contando tres trucos para nosequé esperando que si se hace viral tu negocio cambie por completo (*jajajajaja*)",
    "Ser __el mejor en lo tuyo__ pero verte adelantado por gente más jóven que si que __entiende como tener un negocio__ te pase por la derecha como cuando *tu primillo chico te humilla a los videojuegos*.",
  ]),
  p("*Sigo?*"),
  list([
    "Pensar que __actualizar la web o el portfolio__ es más importante que *salir a tocar puertas* de gente que podría pagarte __5 veces más__ de lo que has cobrado jamás por algo.",
    "Que tú lo que quieres es __crear un producto más accesible__ pensando que te lo va a comprar más gente y que si lo compran 20, 50 o 100 llegarás a un objetivo (*cuando no eres capaz de vender una unidad de NADA*)",
    "Que te tienes que __comprar un mejor equipo__ para desempeñar mejor una labor que *de momento no has sido capaz de que te pida nadie*.",
  ]),
  p("__35 minutos__ para pegarle una paliza al fifa a tu primillo chico *aprendiendo por fin los botones que tienes que tocar para ganar*."),
  { id: "d-strong-end", type: "strong", text: "__Dejando tu correo aquí.__" },
  { id: "d-form2", type: "form", source: "carta_final" },
  { id: "d-videos", type: "videos" },
  { id: "d-screens", type: "screenshots" },
  { id: "d-form3", type: "form", source: "carta_testimonios" },
];

// Valida lo que venga de la base de datos; si no cuadra, se usa la carta por defecto.
export const parseCartaBlocks = (value: unknown): CartaBlock[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const ok = value.every(
    (b) =>
      b &&
      typeof b === "object" &&
      typeof (b as CartaBlock).id === "string" &&
      (b as CartaBlock).type in BLOCK_LABELS
  );
  return ok ? (value as CartaBlock[]) : null;
};

// ── Texto corrido ⇄ bloques (editor de /admin/carta) ─────────────────────────
// El editor muestra todo el texto entre CTAs como una sola caja:
//   línea en blanco → párrafo nuevo
//   # texto         → titular
//   > texto         → párrafo destacado
//   - texto         → punto de lista (líneas seguidas = misma lista)

const TEXT_BLOCK_TYPES: CartaBlockType[] = ["heading", "p", "strong", "list"];
export const isTextBlock = (b: CartaBlock) => TEXT_BLOCK_TYPES.includes(b.type);

export const blocksToText = (blocks: CartaBlock[]): string =>
  blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `# ${b.text}`;
        case "strong":
          return `> ${b.text}`;
        case "p":
          return b.text;
        case "list":
          return b.items.map((t) => `- ${t}`).join("\n");
        default:
          return "";
      }
    })
    .join("\n\n");

export const textToBlocks = (text: string): CartaBlock[] => {
  const out: CartaBlock[] = [];
  for (const chunk of text.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const id = crypto.randomUUID();
    if (lines.every((l) => l.startsWith("- "))) {
      out.push({ id, type: "list", items: lines.map((l) => l.slice(2).trim()) });
    } else if (lines[0].startsWith("# ")) {
      out.push({ id, type: "heading", text: lines.join(" ").slice(2).trim() });
    } else if (lines[0].startsWith("> ")) {
      out.push({ id, type: "strong", text: lines.join(" ").slice(2).trim() });
    } else {
      out.push({ id, type: "p", text: lines.join(" ") });
    }
  }
  return out;
};
