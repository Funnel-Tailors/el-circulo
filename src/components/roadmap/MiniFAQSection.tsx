import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const miniFaqs = [
  {
    question: "€5.000 es mucho dinero. ¿Y si no funciona?",
    answer:
      "FLOC cerró un proyecto de branding de €20.000 con menos de 3 días de anuncios. Con UN solo cierre ya recuperó la inversión cuatro veces. Si tú no lo consigues con el mismo sistema, igual el problema no es el precio. Es que hay creativos que ejecutan y creativos que buscan excusas. La pregunta real no es si te lo puedes permitir. Es cuántos meses más te puedes permitir seguir cobrando €1.500 por proyectos que valen €8.000.",
  },
  {
    question: "Ya me he gastado dinero en cursos y masterminds que no sirvieron de nada.",
    answer:
      "Normal. Porque la mayoría de cursos te enseñan 'estrategias de marketing' genéricas pensadas para coaches de vida y vendedores de infoproductos. Tú no eres eso. Eres un estudio creativo y necesitas un sistema para vender SERVICIOS CREATIVOS a empresas que pagan bien. El Círculo no es un curso. No hay 47 módulos que nunca vas a terminar. Son 5 días para montar tu sistema, una consulta 1:1 donde diseñamos TU oferta premium, y un CRM que organiza todo. Si tu experiencia anterior fue sentarte a ver vídeos motivacionales y luego no saber qué hacer el lunes, esto no tiene nada que ver.",
  },
  {
    question: "No tengo tiempo. Estoy hasta arriba de proyectos.",
    answer:
      "Perfecto. Eso significa que tienes demanda pero cobras poco. El clásico. Si estás trabajando 12 horas al día para facturar €2.000-€3.000 al mes, el problema no es que te falte tiempo. Es que necesitas menos clientes que paguen más. El programa son 5 días. No 5 meses. No 'a tu ritmo' (que todos sabemos que significa 'nunca'). La consulta es una hora. El CRM te AHORRA tiempo porque deja de perder leads entre WhatsApps, emails y DMs que nunca contestaste. Tu agenda no se va a liberar sola. Se libera cuando cobras €10.000 por proyecto en vez de €1.500.",
  },
];

export const MiniFAQSection = () => {
  return (
    <div className="mt-16 mb-8">
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>

        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Antes de darle al boton (y las respuestas que no quieres oir)
        </p>

        <div className="flex items-center justify-center gap-4 mt-4" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {miniFaqs.map((faq, index) => (
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
