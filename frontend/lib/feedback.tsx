'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode, useSyncExternalStore } from 'react';

export type FeedbackType = 'none' | 'error' | 'success' | 'warning' | 'info';

export interface Feedback {
  type: FeedbackType;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface FeedbackContextType {
  getFeedback: () => Feedback | null;
  subscribe: (callback: () => void) => () => void;
  showError: (message: string, title?: string, action?: Feedback['action']) => void;
  showSuccess: (message: string, title?: string, action?: Feedback['action']) => void;
  showWarning: (message: string, title?: string, action?: Feedback['action']) => void;
  showInfo: (message: string, title?: string, action?: Feedback['action']) => void;
  showFeedback: (feedback: Feedback) => void;
  clearFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const feedbackRef = useRef<Feedback | null>(null);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const notify = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const getFeedback = useCallback(() => feedbackRef.current, []);

  const clearFeedback = useCallback(() => {
    feedbackRef.current = null;
    notify();
  }, [notify]);

  const showError = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    feedbackRef.current = {
      type: 'error',
      title: title || 'Erro',
      message,
      action: action || { label: 'Entendi', onClick: clearFeedback },
      persistent: true
    };
    notify();
  }, [notify, clearFeedback]);

  const showSuccess = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    feedbackRef.current = {
      type: 'success',
      title: title || 'Sucesso',
      message,
      action: action || { label: 'OK', onClick: clearFeedback },
      persistent: true
    };
    notify();
  }, [notify, clearFeedback]);

  const showWarning = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    feedbackRef.current = {
      type: 'warning',
      title: title || 'Atenção',
      message,
      action: action || { label: 'Entendi', onClick: clearFeedback },
      persistent: true
    };
    notify();
  }, [notify, clearFeedback]);

  const showInfo = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    feedbackRef.current = {
      type: 'info',
      title: title || 'Informação',
      message,
      action: action || { label: 'OK', onClick: clearFeedback },
      persistent: true
    };
    notify();
  }, [notify, clearFeedback]);

  const showFeedback = useCallback((fb: Feedback) => {
    feedbackRef.current = {
      ...fb,
      persistent: fb.persistent !== false
    };
    notify();
  }, [notify]);

  return (
    <FeedbackContext.Provider value={{
      getFeedback,
      subscribe,
      showError,
      showSuccess,
      showWarning,
      showInfo,
      showFeedback,
      clearFeedback
    }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  
  const feedback = useSyncExternalStore(
    context.subscribe,
    context.getFeedback,
    context.getFeedback
  );

  return {
    feedback,
    showError: context.showError,
    showSuccess: context.showSuccess,
    showWarning: context.showWarning,
    showInfo: context.showInfo,
    showFeedback: context.showFeedback,
    clearFeedback: context.clearFeedback
  };
}
