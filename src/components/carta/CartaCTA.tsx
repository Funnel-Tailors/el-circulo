import CirculoPaymentCTA from "@/components/roadmap/CirculoPaymentCTA";

const CARTA_PAYMENT_URL = "https://link.fastpaydirect.com/payment-link/69ae003d1934f9211e5d0fc1";

const CartaCTA = () => {
  return (
    <div className="py-16 md:py-24 px-6">
      <CirculoPaymentCTA
        variant="full"
        source="carta"
        paymentUrl={CARTA_PAYMENT_URL}
        ctaLabel="ENTRAR AL CÍRCULO"
        ctaSubLabel="La invitación será enviada automáticamente"
      />
    </div>
  );
};

export default CartaCTA;
