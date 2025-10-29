import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Por qué necesitáis mi WhatsApp?",
    answer:
      "Porque funciona. El correo lo ignoras, los DMs de Instagram los dejas en visto. WhatsApp lo abres inmediatamente. Ah, y si quieres resultados vas a tener que dejar de esconderte detrás de formularios web que nunca rellenas del todo.",
  },
  {
    question: "¿Me vais a spamear?",
    answer:
      "Sí. Con un mensaje confirmando que tenemos tu contacto. Luego lo suficiente para que aparezcas con tiempo de calidad en la llamada y no hagas perder el tiempo a miembros honorarios.",
  },
  {
    question: "¿Qué hacéis con mis datos?",
    answer: "Nada. Los usamos para llamarte y ya. Fin. Siguiente pregunta paranoica.",
  },
  {
    question: "¿Me vais a intentar vender algo en la llamada?",
    answer:
      "Obviamente. Es literalmente lo que hacemos aquí. Lo que no hacemos es colocarte algo que no necesites. Si no tienes que entrar, no lo harás. Si tienes que entrar, te guiarán en el proceso. Simple.",
  },
  {
    question: "¿Tengo que agendar ahora mismo?",
    answer:
      "No. Puedes dejarlo para mañana. Y pasado. Y el mes que viene. Mientras tanto seguirás donde estás: cobrando poco, trabajando mucho, y preguntándote por qué otros sí lo consiguen. xd",
  },
  {
    question: "¿Qué pasa en la llamada?",
    answer:
      "Preguntas. Muchas. Sobre todo responderán las tuyas. Te enseñarán la comunidad por dentro y si es el mecanismo adecuado para conseguir tus objetivos.",
  },
  {
    question: "¿Y si después de la llamada no me interesa?",
    answer: "Tú sabes que si le das al botón rojo en una llamada se acaba, no?",
  },
  {
    question: "¿Por qué solo 3 espacios por semana?",
    answer:
      "Porque no queremos a cualquiera dentro. Cada miembro que entra diluye mi atención del resto. Y porque los miembros honorarios están ocupados vendiendo sus propios servicios y hacen esto como un extra que no necesitan. Si eres un malito ahórrate hacerles perder el tiempo.",
  },
];

export const FAQSection = () => {
  return (
    <div className="mt-24">
      <div className="text-center space-y-6 mb-11 md:mb-5 animate-fade-in">
        {/* Divider superior */}
        <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
          ANTES DE CRUZAR EL UMBRAL
        </h2>

        <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
          Las preguntas que te estás haciendo ahora mismo (y las respuestas que no quieres oír)
        </p>

        {/* Divider inferior */}
        <div className="flex items-center justify-center gap-4 pt-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="glass-card-dark rounded-xl px-6 py-2 border-border/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 data-[state=open]:scale-[1.01]"
          >
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <span className="font-semibold text-foreground">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 pt-0">
              <span className="font-bold text-foreground">
                {faq.answer.split(" ")[0]}
              </span>{" "}
              {faq.answer.split(" ").slice(1).join(" ")}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
