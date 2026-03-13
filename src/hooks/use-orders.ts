import { useOrderStore } from "@/stores/order-store";

export function useOrders() {
  return useOrderStore((state) => state.orders);
}

export function useOrder(id: string | undefined) {
  return useOrderStore((state) => state.orders.find((o) => o.id === id));
}

export function useOrderActions() {
  return useOrderStore((state) => ({
    addOrder: state.addOrder,
    updateOrder: state.updateOrder,
    deleteOrder: state.deleteOrder,
    addPosition: state.addPosition,
    updatePosition: state.updatePosition,
    deletePosition: state.deletePosition,
    reorderPositions: state.reorderPositions,
  }));
}
