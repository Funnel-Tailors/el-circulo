import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "€3.000/mes es mucho dinero. ¿Y si no funciona?",
    answer:
      "€3.000 es exactamente lo que cobras por un proyecto que te lleva 3 meses de revisiones infinitas con un cliente que te regateó hasta el alma. Ese es el problema. Este programa existe para que tu siguiente proyecto sea de €10.000-€15.000. Con UN solo cierre ya recuperaste la inversión. No dos. No cinco. Uno. La pregunta real no es si te lo puedes permitir. Es cuántos meses más te puedes permitir seguir cobrando €1.500 por brandings que valen €8.000.",
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
  {
    question: "Soy freelance / solo somos 2 personas. ¿Esto no es para agencias más grandes?",
    answer:
      "Esto está diseñado ESPECÍFICAMENTE para estudios de 1 a 5 personas. No para agencias de 30 empleados con departamento comercial. Si fueras una agencia grande no necesitarías esto. Ellos ya tienen comerciales. Tú eres el diseñador, el director creativo, el project manager, el que manda facturas Y el que tiene que vender. Da igual si haces branding, web, audiovisual o contenido. Lo que importa es que sabes hacer buen trabajo pero no sabes ponerle el precio que merece ni conseguir clientes que lo paguen sin regatear.",
  },
  {
    question: "¿Y si mi nicho es muy específico?",
    answer:
      "Da igual tu especialidad. El problema es el mismo: no tienes una oferta clara, no sabes a quién venderla, y cuando la vendes, te compran por precio. 'Hago webs' no es una oferta. 'Hago branding' tampoco. En la consulta 1:1 diseñamos TU oferta premium para TU tipo de cliente ideal. No una plantilla. No un framework genérico. Una oferta tan específica que cuando tu cliente la lee, piensa 'esto es exactamente lo que necesito' y deja de compararte con el de Fiverr.",
  },
  {
    question: "¿Qué es exactamente 'El Artefacto'?",
    answer:
      "Es un CRM diseñado para estudios creativos que venden servicios premium. No es un Notion con plantillas bonitas. No es un Trello con columnas de colores. Es la herramienta donde vives tu proceso comercial: desde que un lead entra hasta que firma y paga. Pipeline de ventas, seguimiento de propuestas, automatizaciones para que no se te olvide hacer follow-up (que es donde el 80% de las ventas se mueren). Solo lo tienen los miembros del Círculo. No se vende por separado.",
  },
  {
    question: "¿Y si no soy bueno vendiendo? Soy creativo, no comercial.",
    answer:
      "Exacto. Por eso existe esto. No te vamos a convertir en un vendedor de teletienda. No vas a hacer llamadas en frío ni mandar mensajes de 'Hola, vi tu perfil y me encantaría...'. Lo que sí vas a hacer es aprender a tener conversaciones donde el cliente entiende el valor de lo que haces y paga sin regatear. Cerrar sin descuentos desesperados ni 'te lo dejo en...'. La mayoría de creativos que entran dicen 'odio vender'. A las dos semanas dicen 'no sabía que vender podía ser así'.",
  },
  {
    question: "¿Tengo que decidirme ahora?",
    answer:
      "No. Puedes dejarlo para mañana. Y pasado. Y el mes que viene. Mientras tanto seguirás donde estás: cobrando poco, trabajando mucho, y preguntándote por qué otros sí lo consiguen. Lo que sí te digo es que el sitio es limitado porque cada miembro recibe atención personalizada y una consulta 1:1. No metemos a 200 personas en un grupo de Telegram y les deseamos suerte. Si quieres entrar, entra. Si no, no pasa nada. Pero no finjas que 'lo piensas' cuando lo que estás haciendo es buscar excusas para seguir igual.",
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

        <h2 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tight glow leading-[0.85em]">
          PREGUNTAS QUE TE ESTAS HACIENDO
        </h2>

        <p className="md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed text-sm">
          Antes de darle al boton (y las respuestas que no quieres oir)
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
