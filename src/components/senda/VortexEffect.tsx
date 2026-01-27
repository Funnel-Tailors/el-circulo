import PortalVortex, { type PortalVortexProps } from "@/components/shared/PortalVortex";

/**
 * VortexEffect - Wrapper for PortalVortex maintaining backwards compatibility
 *
 * @deprecated Use PortalVortex directly from @/components/shared/PortalVortex
 */
interface VortexEffectProps extends Omit<PortalVortexProps, 'idPrefix'> {}

const VortexEffect = (props: VortexEffectProps) => {
  return <PortalVortex {...props} idPrefix="sendaVortex" />;
};

export default VortexEffect;
