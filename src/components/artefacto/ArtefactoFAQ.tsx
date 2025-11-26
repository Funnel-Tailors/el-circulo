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
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mb-6">
            Preguntas frecuentes
          </h2>
          <div className="flex items-center justify-center gap-3 text-foreground/40">
            <span className="text-xl">⟡</span>
            <span className="text-xl">✦</span>
            <span className="text-xl">⟡</span>
          </div>
        </div>

        <div className="glass-card-dark p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-foreground/80">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
