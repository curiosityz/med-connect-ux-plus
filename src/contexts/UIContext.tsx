import React, { createContext, useReducer, useContext, ReactNode, useCallback } from 'react';
import { uiReducer, initialUIState, UIState, UIAction } from '../reducers/uiReducer';

interface UIContextType {
  uiState: UIState;
  uiDispatch: React.Dispatch<UIAction>;
  setTheme: (theme: UIState['theme']) => void;
  setGlobalLoading: (isLoading: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'> & { id?: string }) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  openModal: (content: React.ReactNode, title?: string) => void;
  closeModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uiState, uiDispatch] = useReducer(uiReducer, initialUIState);

  const setTheme = useCallback((theme: UIState['theme']) => {
    uiDispatch({ type: 'SET_THEME', payload: theme });
    // You might also want to persist this to localStorage and update the 'next-themes' ThemeProvider
    // For example, by calling a function from 'next-themes' if available, or setting documentElement class
  }, []);

  const setGlobalLoading = useCallback((isLoading: boolean) => {
    uiDispatch({ type: 'SET_GLOBAL_LOADING', payload: isLoading });
  }, []);

  const addNotification = useCallback((notification: Omit<UIState['notifications'][0], 'id'> & { id?: string }) => {
    uiDispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const removeNotification = useCallback((id: string) => {
    uiDispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const toggleSidebar = useCallback(() => {
    uiDispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebarOpen = useCallback((isOpen: boolean) => {
    uiDispatch({ type: 'SET_SIDEBAR_OPEN', payload: isOpen });
  }, []);

  const openModal = useCallback((content: React.ReactNode, title?: string) => {
    uiDispatch({ type: 'OPEN_MODAL', payload: { content, title } });
  }, []);

  const closeModal = useCallback(() => {
    uiDispatch({ type: 'CLOSE_MODAL' });
  }, []);

  return (
    <UIContext.Provider
      value={{
        uiState,
        uiDispatch,
        setTheme,
        setGlobalLoading,
        addNotification,
        removeNotification,
        toggleSidebar,
        setSidebarOpen,
        openModal,
        closeModal,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within an UIProvider');
  }
  return context;
};