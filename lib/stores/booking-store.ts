"use client";

import { create } from "zustand";

import type { AvailabilitySlotDto, BarberDto, ServiceDto } from "@/types/domain";

interface BookingState {
  // Data from API
  services: ServiceDto[];
  barbers: BarberDto[];
  slots: AvailabilitySlotDto[];

  // User selections
  selectedServiceIds: string[];
  selectedBarberId: string;
  selectedDate: string;
  selectedSlot: AvailabilitySlotDto | null;

  // UI state
  loading: boolean;
  error: string | null;
  success: string | null;
  bookingId: string | null;

  // Setters
  setServices: (services: ServiceDto[]) => void;
  setBarbers: (barbers: BarberDto[]) => void;
  setSlots: (slots: AvailabilitySlotDto[]) => void;
  setSelectedServiceIds: (serviceIds: string[]) => void;
  toggleService: (serviceId: string) => void;
  setSelectedBarberId: (barberId: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedSlot: (slot: AvailabilitySlotDto | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setBookingId: (id: string | null) => void;
  reset: () => void;

  // Computed helpers
  getSelectedServices: () => ServiceDto[];
  getTotalPrice: () => number;
  getTotalDuration: () => number;
  getSelectedBarber: () => BarberDto | null;
}

const today = new Date().toISOString().slice(0, 10);

export const useBookingStore = create<BookingState>((set, get) => ({
  services: [],
  barbers: [],
  slots: [],
  selectedServiceIds: [],
  selectedBarberId: "",
  selectedDate: today,
  selectedSlot: null,
  loading: false,
  error: null,
  success: null,
  bookingId: null,

  setServices: (services) => set({ services }),
  setBarbers: (barbers) => set({ barbers }),
  setSlots: (slots) => set({ slots }),
  setSelectedServiceIds: (selectedServiceIds) => set({ selectedServiceIds }),
  toggleService: (serviceId) => {
    const current = get().selectedServiceIds;
    if (current.includes(serviceId)) {
      set({ selectedServiceIds: current.filter((id) => id !== serviceId) });
    } else {
      set({ selectedServiceIds: [...current, serviceId] });
    }
  },
  setSelectedBarberId: (selectedBarberId) => set({ selectedBarberId }),
  setSelectedDate: (selectedDate) => set({ selectedDate, selectedSlot: null, slots: [] }),
  setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setBookingId: (bookingId) => set({ bookingId }),
  reset: () =>
    set({
      selectedServiceIds: [],
      selectedBarberId: "",
      selectedDate: today,
      selectedSlot: null,
      slots: [],
      loading: false,
      error: null,
      success: null,
      bookingId: null,
    }),

  getSelectedServices: () => {
    const { services, selectedServiceIds } = get();
    return services.filter((s) => selectedServiceIds.includes(s.id));
  },
  getTotalPrice: () => {
    return get()
      .getSelectedServices()
      .reduce((sum, s) => sum + s.price, 0);
  },
  getTotalDuration: () => {
    return get()
      .getSelectedServices()
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  },
  getSelectedBarber: () => {
    const { barbers, selectedBarberId } = get();
    return barbers.find((b) => b.id === selectedBarberId) ?? null;
  },
}));

// Keep old name as alias for backward compat
export const useBookingDemoStore = useBookingStore;
