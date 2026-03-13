import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Order, Position } from "@/types";

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addPosition: (orderId: string, position: Position) => void;
  updatePosition: (orderId: string, positionId: string, updates: Partial<Position>) => void;
  deletePosition: (orderId: string, positionId: string) => void;
  reorderPositions: (orderId: string, positionIds: string[]) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    immer((set) => ({
      orders: [],

      addOrder: (order) =>
        set((state) => {
          state.orders.push(order);
        }),

      updateOrder: (id, updates) =>
        set((state) => {
          const index = state.orders.findIndex((o) => o.id === id);
          if (index !== -1) {
            Object.assign(state.orders[index], updates, { updatedAt: new Date().toISOString() });
          }
        }),

      deleteOrder: (id) =>
        set((state) => {
          state.orders = state.orders.filter((o) => o.id !== id);
        }),

      addPosition: (orderId, position) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (order) {
            position.sortOrder = order.positions.length;
            order.positions.push(position);
            order.updatedAt = new Date().toISOString();
          }
        }),

      updatePosition: (orderId, positionId, updates) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (order) {
            const pos = order.positions.find((p) => p.id === positionId);
            if (pos) {
              Object.assign(pos, updates);
              order.updatedAt = new Date().toISOString();
            }
          }
        }),

      deletePosition: (orderId, positionId) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (order) {
            order.positions = order.positions.filter((p) => p.id !== positionId);
            order.updatedAt = new Date().toISOString();
          }
        }),

      reorderPositions: (orderId, positionIds) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (order) {
            const posMap = new Map(order.positions.map((p) => [p.id, p]));
            order.positions = positionIds
              .map((id, i) => {
                const p = posMap.get(id);
                if (p) p.sortOrder = i;
                return p;
              })
              .filter((p): p is Position => p !== undefined);
            order.updatedAt = new Date().toISOString();
          }
        }),
    })),
    {
      name: "dimacon-orders",
    }
  )
);
