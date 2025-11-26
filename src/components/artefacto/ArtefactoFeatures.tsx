import { 
  LayoutDashboard, 
  Workflow, 
  Calendar, 
  Mail, 
  MessageCircle, 
  Target, 
  FileText, 
  Globe, 
  BarChart3, 
  Bot 
} from "lucide-react";
import { ArtefactoFeatureCard } from "./ArtefactoFeatureCard";

export const ArtefactoFeatures = () => {
  const features = [
    {
      icon: LayoutDashboard,
      title: "CRM Completo",
      description: "Todos tus leads y clientes en un solo lugar, sin perderte en pestañas"
    },
    {
      icon: Workflow,
      title: "Automatizaciones",
      description: "Secuencias que trabajan mientras duermes y nunca olvidan un seguimiento"
    },
    {
      icon: Calendar,
      title: "Calendario Integrado",
      description: "Agenda llamadas sin el ping-pong de emails de 'cuándo te va bien'"
    },
    {
      icon: Mail,
      title: "Email Marketing",
      description: "Campañas y nurturing automático que mantienen tus leads calientes"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Business",
      description: "Mensajes y chatbots integrados para responder al instante"
    },
    {
      icon: Target,
      title: "Pipelines Visuales",
      description: "Ve de un vistazo cada lead, en qué fase está y qué hacer después"
    },
    {
      icon: FileText,
      title: "Propuestas Rastreadas",
      description: "Envía, trackea y firma propuestas sin salir de la plataforma"
    },
    {
      icon: Globe,
      title: "Funnels y Webs",
      description: "Crea landing pages y funnels sin tocar código ni contratar diseñador"
    },
    {
      icon: BarChart3,
      title: "Reportes Claros",
      description: "Métricas que realmente importan: qué funciona y qué está quemando dinero"
    },
    {
      icon: Bot,
      title: "IA Integrada",
      description: "Asistentes que califican leads y agendan por ti automáticamente"
    }
  ];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-black text-foreground mb-6">
            Todo lo que necesitas
          </h2>
          <div className="flex items-center justify-center gap-3 text-foreground/40 mb-6">
            <span className="text-xl">⟡</span>
            <span className="text-xl">✦</span>
            <span className="text-xl">⟡</span>
          </div>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            El sistema completo que usan los miembros del Círculo para gestionar su negocio
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <ArtefactoFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
