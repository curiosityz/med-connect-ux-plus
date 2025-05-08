export interface UIState {
  theme: 'light' | 'dark' | 'system';
  isLoadingGlobal: boolean; // For global loading indicators, e.g., initial app load
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'error' | 'warning'; duration?: number }>;
  isSidebarOpen: boolean;
  modal: {
    isOpen: boolean;
    content: React.ReactNode | null;
    title?: string;
  };
  // Add other UI related states, e.g., drawer states, specific component visibility flags
}

export const initialUIState: UIState = {
  theme: 'system', // Default to system preference
  isLoadingGlobal: false,
  notifications: [],
  isSidebarOpen: false,
  modal: {
    isOpen: false,
    content: null,
    title: undefined,
  },
};

export type UIAction =
  | { type: 'SET_THEME'; payload: UIState['theme'] }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id'> & { id?: string } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string } // ID of the notification to remove
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'OPEN_MODAL'; payload: { content: React.ReactNode; title?: string } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean };


export const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        isLoadingGlobal: action.payload,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { ...action.payload, id: action.payload.id || Date.now().toString() },
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        isSidebarOpen: action.payload,
      };
    case 'OPEN_MODAL':
      return {
        ...state,
        modal: {
          isOpen: true,
          content: action.payload.content,
          title: action.payload.title,
        },
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: {
          isOpen: false,
          content: null,
          title: undefined,
        },
      };
    default:
      return state;
  }
};