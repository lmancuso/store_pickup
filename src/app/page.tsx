import { Suspense } from "react";
import { AppFallback } from "@/components/app/AppFallback";
import { StorePickupApp } from "@/components/StorePickupApp";

export default function Home() {
  return (
    // El estado inicial del chat usa la hora actual: se renderiza por request
    // (streaming) y el shell estático queda prerenderizado.
    <Suspense fallback={<AppFallback />}>
      <StorePickupApp />
    </Suspense>
  );
}
