import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ArtefactoFAQ = () => {
  const faqs = [
    {
      question: "¿Qué es exactamente El Artefacto?",
      answer: "Es un CRM completo + automatizaciones + calendario + email marketing + WhatsApp + funnels todo integrado en una plataforma. Básicamente, todo lo que necesitas para gestionar tu negocio sin perder leads ni oportunidades."
    },
    {
      question: "¿Necesito saber de tecnología?",
      answer: "No. Si sabes usar WhatsApp y Gmail, sabes usar El Artefacto. Todo está diseñado para ser intuitivo, sin curvas de aprendizaje eternas ni documentación técnica que nunca lees."
    },
    {
      question: "¿Es otro software más que aprender?",
      answer: "Al revés. El Artefacto REEMPLAZA las 8-10 herramientas que estás usando ahora (Notion, Calendar, Excel, WhatsApp Business, email marketing...). En lugar de aprender más cosas, simplificas todo en un solo lugar."
    },
    {
      question: "¿Tiene soporte?",
      answer: "Sí, soporte prioritario para miembros del Círculo. No es un chatbot genérico, es soporte real de gente que entiende tu negocio y usa la misma herramienta."
    },
    {
      question: "¿Puedo cancelar cuando quiera?",
      answer: "Sí, sin permanencias ni letra pequeña. Si decides que no es para ti, cancelas y ya está. Aunque rara vez pasa cuando ves cuántos leads dejas de perder."
    },
    {
      question: "¿Por qué es tan barato?",
      answer: "Porque es el precio de lanzamiento para miembros del Círculo. Herramientas similares cuestan €200-500/mes. Este precio no durará para siempre, pero los que entren ahora lo mantienen."
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-6 mb-11 md:mb-5 animate-fade-in">
          {/* Divider superior */}
          <div className="flex items-center justify-center gap-4 mb-4" aria-hidden="true">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border"></div>
            <div className="text-muted-foreground text-xs tracking-widest">⟡</div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border"></div>
          </div>

          <h2 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
            PREGUNTAS FRECUENTES
          </h2>

          <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
            Las dudas más comunes sobre El Artefacto
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
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
