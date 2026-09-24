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

// Énfasis de la carta: subrayado para las ideas clave, itálica para tono y apartes.
const U = ({ children }: { children: ReactNode }) => (
  <span className="underline decoration-foreground/50 decoration-[1.5px] underline-offset-[5px] text-foreground">
    {children}
  </span>
);
const I = ({ children }: { children: ReactNode }) => <em className="italic">{children}</em>;

const bodyClass = "font-text text-[18px] md:text-[19px] leading-[1.65] text-foreground/85 space-y-6";

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
          No te parece <em>injusto</em>?
        </h1>

        <div className={bodyClass}>
          <P>Quiero decir.</P>
          <P>
            Eres <U>un soplo de calidad en un sector mediocre</U> lleno de servicios basura que el{" "}
            <I>“entrepreneur”</I> medio dice que va a desaparecer por culpa de la IA.
          </P>
          <P>
            Una <U>aguja de oro en un pajar</U> en el que cada hebra se genera con chatgpt creando
            una <I>amalgama de mediocridad infumable</I>. Digo.
          </P>
          <P>
            Y aún así <U>no paras de compararte</U> con otra gente de tu sector que{" "}
            <U>firma los clientes que tu no consigues</U> pese a ser <I>no-tan-buenos</I>, eh?
          </P>
          <P>
            Por mucho que entre una crisis y la siguiente en la que{" "}
            <U>te planteas si has elegido la opción correcta a la que dedicarte</U> te entren <I>arrebatos de hacer contenido</I>, o lo
            que sea que te haya dicho el gurú de turno.
          </P>
          <P>
            Pero mañana suena el despertador y el mundo sigue girando y{" "}
            <U>tu agenda sigue vacía y tu cuenta temblando</U>.
          </P>
          <P>
            Todo mientras la fecha del trimestre o de la cuota de autónomos avanza{" "}
            <I>inexorable</I>.
          </P>
          <P>
            <I>Jo-der.</I>
          </P>
          <P>
            Puede que en algún momento hayas pensado cosas como que <I>la gente no paga</I>.
          </P>
          <P>
            Que - <I>inserte sector aquí</I> - está fatal.
          </P>
          <P>
            Que la gente a la que va bien tiene <I>mucha suerte</I> o <I>mucho privilegio</I> o está{" "}
            <I>enchufado por nosequién</I>.
          </P>
          <P>Pero si buscas a alguien que te de la razón…</P>
          <P>
            <U>Aquí no es.</U>
          </P>
          <P>
            No seré yo quien legitime a <I>la industria más llorona que he conocido jamás</I>.
          </P>
          <P>Ahora bien…</P>
          <P>
            Si eres un poco más <I>espabilati con tomati</I> y has entendido que{" "}
            <U>debe haber “algo” que se te escapa</U> para que haya agencias que se aprovechan del
            trabajo de pobres diablos (<I>como tú</I>))
          </P>
          <P>
            “Algo” que hace que <U>cierran proyectos millonarios</U> mientras se nutren del trabajo
            de gente buena pero irrelevante a la que le pagan <I>un 1% de lo que ganan</I>…
          </P>
          <P>
            “Algo” que hace que <U>clientes con pasta</U> y con muy pocas ganas de darte chapas
            interminables por whatsapp <U>estén deseando trabajar contigo</U>. (
            <I>aunque no seas el más barato</I>)
          </P>
          <P>
            “Algo” que sabe la gente que <U>cobra por adelantado</U> sin tener que lidiar con
            retrasos ni <I>cincuentaporcientos</I> a la entrega del proyecto que se alarga más de lo
            que tenías previsto.
          </P>
          <P>
            “Algo”, <I>maifren</I>, que puedes aprender <U>completamente gratis</U> si cumples dos
            condiciones que todo hijo de vecino podría:
          </P>
          <List
            items={[
              <>
                La primera, que encadenes las neuronas suficientes para prestar{" "}
                <U>35 minutos de atención</U> a un video que voy a mandar directo a tu correo (
                <I>y que no encontrarás en ningún otro sitio</I>)
              </>,
              <>
                La segunda, que <U>me dejes aquí abajo tu correo</U>.
              </>,
            ]}
          />
        </div>

        <div className="my-10">
          <LeadForm done={done} onSuccess={onSuccess} source="carta_condiciones" />
        </div>

        <div className={bodyClass}>
          <P>
            Y es que te voy a ser honesto, <U>ese algo funciona</U>.
          </P>
          <P>
            Funcionó para que Nico pasara de <U>cobrar 200€ por una web a cobrar los 4000</U> que
            pide ahora (<I>cerrando varios proyectos cada mes</I>)
          </P>
          <P>
            Funcionó también para que Diego, que venía <I>temeroso de cobrar 100 eurillos</I> por
            un video y encadenaba excusas, encadene proyectos ahora por los que{" "}
            <U>le pagan 4 cifras</U> (<I>2.200€ por el último</I>)
          </P>
          <P>
            O para que Cris o Cynthia o un montón de gente entendiera cómo hacer que la gente{" "}
            <U>les pagara más de 3000 euros</U> por lo que hacían.
          </P>
          <P>Pero esto no va de mi</P>
          <P>
            <I>No, no.</I>
          </P>
          <P>
            Va de <U>lo que hagas tú hoy</U> para estar en la lista interminable de gente que ha
            conseguido <U>multiplicar sus precios</U> y que puedes ver aquí abajo.
          </P>
          <P>
            De lo que <U>llevas haciendo mal puede que años</U> y que te mantiene{" "}
            <I>tieso como una rata atropellada hace dos semanas en la autovía</I>.
          </P>
          <P>Cosas como:</P>
          <List
            items={[
              <>
                Decir <I>gracias por la oportunidad</I>.
              </>,
              <>
                <U>Mandar propuestas y presupuestos</U>
              </>,
              <>
                <U>Borrar el precio</U> al final de esas propuestas y presupuestos{" "}
                <I>15 veces</I> hasta llegar a una cifra lo suficientemente baja como para
                asegurarte de que si te aceptan el proyecto, <I>es una putada</I>.
              </>,
              <>
                Pensar que lo que quieres es dar <U>un servicio recurrente</U> para asegurar (
                <I>pusi</I>)
              </>,
              <>
                <U>Crear contenido</U> (<I>que se te da fatal</I>) contando tres trucos para
                nosequé esperando que si se hace viral tu negocio cambie por completo (
                <I>jajajajaja</I>)
              </>,
              <>
                Ser <U>el mejor en lo tuyo</U> pero verte adelantado por gente más jóven que si que{" "}
                <U>entiende como tener un negocio</U> te pase por la derecha como cuando{" "}
                <I>tu primillo chico te humilla a los videojuegos</I>.
              </>,
            ]}
          />
          <P>
            <I>Sigo?</I>
          </P>
          <List
            items={[
              <>
                Pensar que <U>actualizar la web o el portfolio</U> es más importante que{" "}
                <I>salir a tocar puertas</I> de gente que podría pagarte <U>5 veces más</U> de lo
                que has cobrado jamás por algo.
              </>,
              <>
                Que tú lo que quieres es <U>crear un producto más accesible</U> pensando que te lo
                va a comprar más gente y que si lo compran 20, 50 o 100 llegarás a un objetivo (
                <I>cuando no eres capaz de vender una unidad de NADA</I>)
              </>,
              <>
                Que te tienes que <U>comprar un mejor equipo</U> para desempeñar mejor una labor
                que <I>de momento no has sido capaz de que te pida nadie</I>.
              </>,
            ]}
          />
          <P>
            <U>35 minutos</U> para pegarle una paliza al fifa a tu primillo chico{" "}
            <I>aprendiendo por fin los botones que tienes que tocar para ganar</I>.
          </P>
          <p className="font-medium text-foreground">
            <U>Dejando tu correo aquí.</U>
          </p>
        </div>

        <div className="mt-8">
          <LeadForm done={done} onSuccess={onSuccess} source="carta_final" />
        </div>
      </article>

      {/* Testimonios en vídeo (todos menos Marta) */}
      <section className="max-w-6xl mx-auto pt-10 pb-6" aria-label="Testimonios en vídeo">
        <TestimonialsMarquee cases={videoCases} />
      </section>

      {/* Testimonios en pantallazo */}
      <section className="max-w-5xl mx-auto pt-6 pb-6" aria-label="Testimonios">
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
