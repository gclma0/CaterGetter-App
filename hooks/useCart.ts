import { create } from 'zustand';

export interface CartItem {
  packageId: string;
  packageName: string;
  packageDescription: string | null;
  vendorId: string;
  vendorName: string;
  price: number;          // flat price
  pricePerPerson: number | null;  // per-person pricing (overrides flat if set)
  minGuests: number;
  maxGuests: number;
}

interface CartStore {
  item: CartItem | null;
  setItem: (item: CartItem) => void;
  clearItem: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  item: null,
  setItem: (item) => set({ item }),
  clearItem: () => set({ item: null }),
}));
