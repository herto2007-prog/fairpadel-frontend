import { create } from 'zustand';
import type { Tournament, Category } from '@/types';

interface TournamentState {
  // Estado
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Filtros
  filters: {
    pais?: string;
    region?: string;
    ciudad?: string;
    estado?: string;
    categoriaId?: string;
  };

  // Acciones
  setTournaments: (tournaments: Tournament[]) => void;
  setSelectedTournament: (tournament: Tournament | null) => void;
  setCategories: (categories: Category[]) => void;
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Helpers
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  removeTournament: (id: string) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  // Estado inicial
  tournaments: [],
  selectedTournament: null,
  categories: [],
  isLoading: false,
  error: null,
  filters: {},

  // Setters básicos
  setTournaments: (tournaments) => set({ tournaments }),
  
  setSelectedTournament: (tournament) => set({ selectedTournament: tournament }),
  
  setCategories: (categories) => set({ categories }),
  
  setFilters: (filters) => set({ filters }),
  
  clearFilters: () => set({ filters: {} }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Helpers para manipular torneos
  addTournament: (tournament) => 
    set((state) => ({
      tournaments: [tournament, ...state.tournaments],
    })),

  updateTournament: (id, updates) =>
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
      selectedTournament:
        state.selectedTournament?.id === id
          ? { ...state.selectedTournament, ...updates }
          : state.selectedTournament,
    })),

  removeTournament: (id) =>
    set((state) => ({
      tournaments: state.tournaments.filter((t) => t.id !== id),
      selectedTournament:
        state.selectedTournament?.id === id ? null : state.selectedTournament,
    })),
}));

export default useTournamentStore;