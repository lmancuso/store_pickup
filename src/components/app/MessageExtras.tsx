"use client";

import { CartSummary } from "@/components/order/CartSummary";
import { MenuCard } from "@/components/order/MenuCard";
import { PickupConfirmation } from "@/components/order/PickupConfirmation";
import { QuickReplies } from "@/components/order/QuickReplies";
import { VENDORS } from "@/data";
import type { ConversationMessage, ConversationState, PickupOrder } from "@/lib/conversation";
import { haversineKm } from "@/lib/geo/distance";
import type { ConfirmedOrder } from "@/lib/order";
import type { Vendor } from "@/types";
import { quickReplyOptions } from "./quickReplyOptions";

export interface MessageExtrasProps {
  message: ConversationMessage;
  state: ConversationState;
  /** Índice del último mensaje con carrito adjunto (solo ese muestra el carrito vivo). */
  lastCartIndex: number;
  index: number;
  isLast: boolean;
  /** Mientras el asistente "escribe" se deshabilitan los controles. */
  busy: boolean;
  onAddItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirm: () => void;
  onQuickReply: (text: string) => void;
}

const ORDERING_PHASES: ReadonlySet<ConversationState["phase"]> = new Set(["ordering", "confirming", "clarifying"]);

function toConfirmedOrder(order: PickupOrder): ConfirmedOrder {
  const known = VENDORS.find((v) => v.id === order.vendorId);
  const vendor: Vendor = {
    ...(known ?? { category: "pizza", isOpen: true, prepTimeMinutes: 0, menu: [] }),
    id: order.vendorId,
    name: order.vendorName,
    address: order.address,
    location: order.vendorLocation,
  };
  return {
    code: order.code,
    vendor,
    items: order.items,
    total: order.total,
    pickupAt: new Date(order.pickupAt),
  };
}

/**
 * Lo que se renderiza debajo de una burbuja del asistente según su adjunto:
 * menú (`MenuCard`), carrito (`CartSummary`) o confirmación
 * (`PickupConfirmation`); y en el último mensaje, las respuestas rápidas.
 */
export function MessageExtras({
  message,
  state,
  lastCartIndex,
  index,
  isLast,
  busy,
  onAddItem,
  onRemoveItem,
  onConfirm,
  onQuickReply,
}: MessageExtrasProps) {
  if (message.author !== "assistant") return null;
  const attachment = message.attachment;
  const canOrder = state.vendor !== null && ORDERING_PHASES.has(state.phase);
  let content: React.ReactNode = null;

  if (attachment?.type === "menu") {
    const current = state.vendor?.id === attachment.vendorId ? state.vendor : null;
    const vendor = current ?? VENDORS.find((v) => v.id === attachment.vendorId);
    if (vendor) {
      content = (
        <MenuCard
          vendor={vendor}
          distanceKm={current ? current.distanceKm : haversineKm(state.location, vendor.location)}
          etaMinutes={current?.estimatedMinutes}
          onAdd={onAddItem}
          disabled={busy || !canOrder || current === null}
        />
      );
    }
  } else if (attachment?.type === "cart" && index === lastCartIndex && canOrder) {
    content = (
      <CartSummary
        cart={state.cart}
        onIncrement={onAddItem}
        onDecrement={onRemoveItem}
        onConfirm={onConfirm}
        disabled={busy}
      />
    );
  } else if (attachment?.type === "order" && state.order?.code === attachment.code) {
    content = <PickupConfirmation order={toConfirmedOrder(state.order)} origin={state.location} />;
  }

  const replies = isLast && !busy ? quickReplyOptions(state) : [];
  if (!content && replies.length === 0) return null;
  return (
    <>
      {content}
      {replies.length > 0 && <QuickReplies options={replies} onSelect={onQuickReply} />}
    </>
  );
}
