import { quizAnalytics } from "@/lib/analytics";

const PAYMENT_URL = "https://link.fastpaydirect.com/payment-link/69ae003d1934f9211e5d0fc1";

const CartaCTA = () => {
  const handleClick = () => {
    quizAnalytics.trackEvent({
      event_type: 'cta_click',
      step_id: 'carta_payment',
    });
  };

  return (
    <div className="text-center py-16 md:py-24 px-6 font-mono">
      <a
        href={PAYMENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-block px-8 py-4 bg-white text-[#1c1c1e] font-mono font-bold text-lg hover:bg-white/90 transition-colors duration-200"
      >
        Entrar al Círculo
        <span className="block text-xs font-normal mt-1 opacity-70">La invitación será enviada automáticamente</span>
      </a>
    </div>
  );
};

export default CartaCTA;
