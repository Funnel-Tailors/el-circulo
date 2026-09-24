import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import TestimonialsMarquee from "@/components/roadmap/TestimonialsMarquee";
import ScreenshotMarquee from "@/components/roadmap/ScreenshotMarquee";
import { supabase } from "@/integrations/supabase/client";
import { successCases } from "@/data/roadmap";

// Carta de ventas del lead magnet (vídeo de 35 min por email). Capta solo email
// y lo manda a GHL con las etiquetas "lead magnet" + "oferta" vía
// submit-lead-magnet, que es lo que dispara la automatización del envío.

const leadSchema = z.object({
  email: z.string().trim().email("Revisa el email"),
  website: z.string().optional(), // honeypot
});
type LeadData = z.infer<typeof leadSchema>;

// Todos los testimonios en vídeo menos el de Marta.
const videoCases = successCases.filter((c) => c.name !== "Marta");

const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="space-y-3 pl-5 list-disc marker:text-foreground/40">
    {items.map((item, i) => (
      <li key={i} className="pl-1">
        {item}
      </li>
    ))}
  </ul>
);

interface LeadFormProps {
  done: boolean;
  onSuccess: () => void;
  source: string;
}

// Formulario reutilizable: cuando cualquier instancia acierta, `done` pasa a true
// en el padre y todas muestran el estado de éxito.
const LeadForm = ({ done, onSuccess, source }: LeadFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { email: "", website: "" },
  });

  const handleSubmit = async (data: LeadData) => {
    if (data.website) return; // honeypot
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("submit-lead-magnet", {
        body: { email: data.email.trim().toLowerCase(), source },
      });
      if (error || !res?.success) throw error || new Error("lead_magnet");
      onSuccess();
    } catch (err) {
      console.error("lead magnet submit error:", err);
      toast.error("No pudimos apuntarte. Revisa el email e inténtalo otra vez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8 text-center space-y-2">
        <p className="font-display font-black text-xl md:text-2xl">Hecho. Mira tu correo.</p>
        <p className="text-sm text-muted-foreground">
          El vídeo va de camino. Si no lo ves en unos minutos, mira en spam o promociones y
          muévelo a tu bandeja principal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem className="absolute -left-[9999px]" aria-hidden="true" tabIndex={-1}>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input {...field} type="text" autoComplete="off" tabIndex={-1} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Tu mejor correo</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    inputMode="email"
                    disabled={submitting}
                    className="text-base h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full h-12 text-base font-bold" disabled={submitting}>
            {submitting ? "Enviando…" : "Mándame el vídeo"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            35 minutos. Gratis. Directo a tu correo.
          </p>
        </form>
      </Form>
    </div>
  );
};

const Carta = () => {
  const [done, setDone] = useState(false);
  const onSuccess = () => setDone(true);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <article className="max-w-[640px] mx-auto px-5 pt-16 pb-10 md:pt-24">
        <h1 className="font-display font-black text-5xl md:text-7xl leading-[1em] tracking-[-0.03em] mb-12">
          No te parece injusto?
        </h1>

        <div className="font-text text-[18px] md:text-[19px] leading-[1.65] text-foreground/85 space-y-6">
          <P>Quiero decir.</P>
          <P>
            Eres un soplo de calidad en un sector mediocre lleno de servicios basura que el
            “entrepreneur” medio dice que va a desaparecer por culpa de la IA.
          </P>
          <P>
            Una aguja de oro en un pajar en el que cada hebra se genera con chatgpt creando una
            amalgama de mediocridad infumable. Digo.
          </P>
          <P>
            Y aún así no paras de compararte con otra gente de tu sector que firma los clientes
            que tu no consigues pese a ser no-tan-buenos, eh?
          </P>
          <P>
            Por mucho que entre una crisis y la siguiente en la que te planteas si has elegido la
            opción correcta a la que dedicarte te entren arrebatos de hacer contenido, o lo que
            sea que te haya dicho el gurú de turno.
          </P>
          <P>
            Pero mañana suena el despertador y el mundo sigue girando y tu agenda sigue vacía y tu
            cuenta temblando.
          </P>
          <P>
            Todo mientras la fecha del trimestre o de la cuota de autónomos avanza inexorable.
          </P>
          <P>Jo-der.</P>
          <P>Puede que en algún momento hayas pensado cosas como que la gente no paga.</P>
          <P>Que - inserte sector aquí - está fatal.</P>
          <P>
            Que la gente a la que va bien tiene mucha suerte o mucho privilegio o está enchufado
            por nosequién.
          </P>
          <P>Pero si buscas a alguien que te de la razón…</P>
          <P>Aquí no es.</P>
          <P>No seré yo quien legitime a la industria más llorona que he conocido jamás.</P>
          <P>Ahora bien…</P>
          <P>
            Si eres un poco más espabilati con tomati y has entendido que debe haber “algo” que se
            te escapa para que haya agencias que se aprovechan del trabajo de pobres diablos (como
            tú))
          </P>
          <P>
            “Algo” que hace que cierran proyectos millonarios mientras se nutren del trabajo de
            gente buena pero irrelevante a la que le pagan un 1% de lo que ganan…
          </P>
          <P>
            “Algo” que hace que clientes con pasta y con muy pocas ganas de darte chapas
            interminables por whatsapp estén deseando trabajar contigo. (aunque no seas el más
            barato)
          </P>
          <P>
            “Algo” que sabe la gente que cobra por adelantado sin tener que lidiar con retrasos ni
            cincuentaporcientos a la entrega del proyecto que se alarga más de lo que tenías
            previsto.
          </P>
          <P>
            “Algo”, maifren, que puedes aprender completamente gratis si cumples dos condiciones
            que todo hijo de vecino podría:
          </P>
          <List
            items={[
              "La primera, que encadenes las neuronas suficientes para prestar 35 minutos de atención a un video que voy a mandar directo a tu correo (y que no encontrarás en ningún otro sitio)",
              "La segunda, que me dejes aquí abajo tu correo.",
            ]}
          />
        </div>

        <div className="my-10">
          <LeadForm done={done} onSuccess={onSuccess} source="carta_condiciones" />
        </div>

        <div className="font-text text-[18px] md:text-[19px] leading-[1.65] text-foreground/85 space-y-6">
          <P>Y es que te voy a ser honesto, ese algo funciona.</P>
          <P>
            Funcionó para que Nico pasara de cobrar 200€ por una web a cobrar los 4000 que pide
            ahora (cerrando varios proyectos cada mes)
          </P>
          <P>
            Funcionó también para que Diego, que venía temeroso de cobrar 100 eurillos por un
            video y encadenaba excusas, encadene proyectos ahora por los que le pagan 4 cifras
            (2.200€ por el último)
          </P>
          <P>
            O para que Cris o Cynthia o un montón de gente entendiera cómo hacer que la gente les
            pagara más de 3000 euros por lo que hacían.
          </P>
          <P>Pero esto no va de mi</P>
          <P>No, no.</P>
          <P>
            Va de lo que hagas tú hoy para estar en la lista interminable de gente que ha
            conseguido multiplicar sus precios y que puedes ver aquí abajo.
          </P>
        </div>
      </article>

      {/* Testimonios en vídeo (todos menos Marta) */}
      <section className="max-w-6xl mx-auto py-6" aria-label="Testimonios en vídeo">
        <TestimonialsMarquee cases={videoCases} />
      </section>

      <article className="max-w-[640px] mx-auto px-5 pt-10 pb-10">
        <div className="font-text text-[18px] md:text-[19px] leading-[1.65] text-foreground/85 space-y-6">
          <P>
            De lo que llevas haciendo mal puede que años y que te mantiene tieso como una rata
            atropellada hace dos semanas en la autovía.
          </P>
          <P>Cosas como:</P>
          <List
            items={[
              "Decir gracias por la oportunidad.",
              "Mandar propuestas y presupuestos",
              "Borrar el precio al final de esas propuestas y presupuestos 15 veces hasta llegar a una cifra lo suficientemente baja como para asegurarte de que si te aceptan el proyecto, es una putada.",
              "Pensar que lo que quieres es dar un servicio recurrente para asegurar (pusi)",
              "Crear contenido (que se te da fatal) contando tres trucos para nosequé esperando que si se hace viral tu negocio cambie por completo (jajajajaja)",
              "Ser el mejor en lo tuyo pero verte adelantado por gente más jóven que si que entiende como tener un negocio te pase por la derecha como cuando tu primillo chico te humilla a los videojuegos.",
            ]}
          />
          <P>Sigo?</P>
          <List
            items={[
              "Pensar que actualizar la web o el portfolio es más importante que salir a tocar puertas de gente que podría pagarte 5 veces más de lo que has cobrado jamás por algo.",
              <>
                Que tú lo que quieres es crear un producto más accesible pensando que te lo va a
                comprar más gente y que si lo compran 20, 50 o 100 llegarás a un objetivo (cuando
                no eres capaz de vender una unidad de NADA)
              </>,
              "Que te tienes que comprar un mejor equipo para desempeñar mejor una labor que de momento no has sido capaz de que te pida nadie.",
            ]}
          />
          <P>
            35 minutos para pegarle una paliza al fifa a tu primillo chico aprendiendo por fin los
            botones que tienes que tocar para ganar.
          </P>
          <p className="font-medium text-foreground">Dejando tu correo aquí.</p>
        </div>

        <div className="mt-8">
          <LeadForm done={done} onSuccess={onSuccess} source="carta_final" />
        </div>
      </article>

      {/* Testimonios en pantallazo */}
      <section className="max-w-5xl mx-auto pt-10 pb-6" aria-label="Testimonios">
        <ScreenshotMarquee />
      </section>

      <div className="max-w-[640px] mx-auto px-5 pt-6 pb-20">
        <LeadForm done={done} onSuccess={onSuccess} source="carta_testimonios" />
        <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60">
          El Círculo
        </p>
      </div>
    </div>
  );
};

export default Carta;
