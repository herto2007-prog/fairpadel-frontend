import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  isOpen: boolean;
  data?: any;
}

interface UIState {
  // Toasts
  toasts: Toast[];
  
  // Modals
  modals: Record<string, Modal>;
  
  // Loading states
  isGlobalLoading: boolean;
  
  // Sidebar (mobile)
  isSidebarOpen: boolean;

  // Acciones - Toasts
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Acciones - Modals
  openModal: (id: string, data?: any) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: (id: string) => any;

  // Acciones - UI
  setGlobalLoading: (isLoading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Estado inicial
  toasts: [],
  modals: {},
  isGlobalLoading: false,
  isSidebarOpen: false,

  // Toasts
  showToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove después de duration
    if (newToast.duration) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modals
  openModal: (id, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: { id, isOpen: true, data },
      },
    })),

  closeModal: (id) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: { ...state.modals[id], isOpen: false },
      },
    })),

  isModalOpen: (id) => get().modals[id]?.isOpen || false,

  getModalData: (id) => get().modals[id]?.data,

  // UI
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));

export default useUIStore;