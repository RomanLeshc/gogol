/**
 * Zustand store mirroring the original app's store structure
 */

import { create } from 'zustand';
import { ModelCurrentUser, ModelApp, ModelAiWidgetValues } from './types';

interface AppState {
  inited: boolean;
  currentUser: ModelCurrentUser | null;
  currentApp: ModelApp | null;
  apps: Array<ModelApp>;
  aiWidgetValues: ModelAiWidgetValues;
  
  // Actions
  doSetUser: (user: ModelCurrentUser | null) => void;
  doSetCurrentApp: (app: ModelApp | null) => void;
  doAddApp: (app: ModelApp) => void;
  doSetApps: (apps: Array<ModelApp>) => void;
  doUpdateApp: (app: ModelApp) => void;
  doUpdateUser: (userFieldsForUpdate: Partial<ModelCurrentUser>) => void;
  doClearState: () => void;
  doSetAiValues: (values: ModelAiWidgetValues) => void;
}

export const useAppStore = create<AppState>((set) => ({
  inited: false,
  currentUser: null,
  currentApp: null,
  apps: [],
  aiWidgetValues: {
    displayName: '',
    avatar: '',
  },
  
  doSetUser: (user) => {
    set({ currentUser: user });
  },
  
  doSetCurrentApp: (app) => {
    set({ currentApp: app });
  },
  
  doAddApp: (app) => {
    set((state) => ({
      apps: [...state.apps, app],
    }));
  },
  
  doSetApps: (apps) => {
    set({ apps });
  },
  
  doUpdateApp: (app) => {
    set((state) => {
      const newApps = [...state.apps];
      const index = newApps.findIndex((el) => el._id === app._id);
      
      if (index !== -1) {
        newApps[index] = app;
      } else {
        newApps.push(app);
      }
      
      const currentApp = state.currentApp?._id === app._id ? app : state.currentApp;
      
      return {
        apps: newApps,
        currentApp,
      };
    });
  },
  
  doUpdateUser: (userFieldsForUpdate) => {
    set((state) => {
      if (!state.currentUser) return state;
      
      return {
        currentUser: {
          ...state.currentUser,
          ...userFieldsForUpdate,
        },
      };
    });
  },
  
  doClearState: () => {
    set({
      currentUser: null,
      currentApp: null,
      apps: [],
    });
  },
  
  doSetAiValues: (values) => {
    set({ aiWidgetValues: values });
  },
}));

