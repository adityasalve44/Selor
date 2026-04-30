"use client";

import { create } from "zustand";

import type { AvailabilitySlotDto, BarberDto, ServiceDto } from "@/types/domain";

interface BookingDemoState {
  services: ServiceDto[];
  barbers: BarberDto[];
  selectedServiceIds: string[];
  selectedBarberId: string;
  selectedDate: string;
  slots: AvailabilitySlotDto[];
  loading: boolean;
  error: string | null;
  success: string | null;
  setServices: (services: ServiceDto[]) => void;
  setBarbers: (barbers: BarberDto[]) => void;
  setSelectedServiceIds: (serviceIds: string[]) => void;
  setSelectedBarberId: (barberId: string) => void;
  setSelectedDate: (date: string) => void;
  setSlots: (slots: AvailabilitySlotDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export const useBookingDemoStore = create<BookingDemoState>((set) => ({
  services: [],
  barbers: [],
  selectedServiceIds: [],
  selectedBarberId: "",
  selectedDate: new Date().toISOString().slice(0, 10),
  slots: [],
  loading: false,
  error: null,
  success: null,
  setServices: (services) => set({ services }),
  setBarbers: (barbers) => set({ barbers }),
  setSelectedServiceIds: (selectedServiceIds) => set({ selectedServiceIds }),
  setSelectedBarberId: (selectedBarberId) => set({ selectedBarberId }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSlots: (slots) => set({ slots }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
}));
