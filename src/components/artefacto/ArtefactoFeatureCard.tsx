import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ArtefactoFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export const ArtefactoFeatureCard = ({ icon: Icon, title, description, index }: ArtefactoFeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <div className="glass-card-dark p-6 h-full group hover:border-white/30 transition-all">
        <motion.div
          className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 icon-glow"
          whileHover={{ scale: 1.15, rotate: 5 }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 0.3 }
          }}
        >
          <Icon className="w-6 h-6 text-foreground group-hover:text-white transition-colors" />
        </motion.div>
        
        <h3 className="text-lg font-display font-bold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-foreground/70 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
