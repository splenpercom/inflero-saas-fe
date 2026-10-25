import { ComingSoon } from "../corporate/ComingSoon";

export function HotelsComingSoonPage({
  title,
  titleAz,
}: {
  title: string;
  titleAz: string;
}) {
  return (
    <ComingSoon
      title={title}
      titleAz={titleAz}
      description="Hotel analytics and overview are under development."
      descriptionAz="Otel analitika və ümumi baxış hazırlanır."
      backTo="/dashboard/hotel/reservations"
      backLabelEn="Back to Reservations"
      backLabelAz="Rezervasiyalara qayıt"
    />
  );
}
