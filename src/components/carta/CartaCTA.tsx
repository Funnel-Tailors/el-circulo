import { quizAnalytics } from "@/lib/analytics";

const PAYMENT_URL = "https://link.fastpaydirect.com/payment-link/6917780ad14ec1206b5ae41a";

const CartaCTA = () => {
  return (
    <div className="text-center py-16 md:py-24 px-6 font-mono">
      <span
        className="inline-block px-8 py-4 bg-white/30 text-white/50 font-mono font-bold text-lg cursor-not-allowed"
      >
        Plazo cerrado
        <span className="block text-xs font-normal mt-1 opacity-70">El periodo de entrada ha finalizado</span>
      </span>
    </div>
  );
};

export default CartaCTA;
