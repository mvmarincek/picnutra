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
  isModalOpen: () => boolean;
  subscribe: (callback: () => void) => () => void;
  showError: (message: string, title?: string, action?: Feedback['action']) => void;
  showSuccess: (message: string, title?: string, action?: Feedback['action']) => void;
  showWarning: (message: string, title?: string, action?: Feedback['action']) => void;
  showInfo: (message: string, title?: string, action?: Feedback['action']) => void;
  showFeedback: (feedback: Feedback) => void;
  clearFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

let globalFeedbackRef: Feedback | null = null;
let globalListeners: Set<() => void> = new Set();

function globalNotify() {
  globalListeners.forEach(listener => listener());
}

export function isErrorModalOpen(): boolean {
  return globalFeedbackRef !== null && globalFeedbackRef.type !== 'none';
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const feedbackRef = useRef<Feedback | null>(null);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const notify = useCallback(() => {
    listenersRef.current.forEach(listener => listener());
    globalNotify();
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    globalListeners.add(callback);
    return () => {
      listenersRef.current.delete(callback);
      globalListeners.delete(callback);
    };
  }, []);

  const getFeedback = useCallback(() => feedbackRef.current, []);

  const isModalOpen = useCallback(() => {
    return feedbackRef.current !== null && feedbackRef.current.type !== 'none';
  }, []);

  const clearFeedback = useCallback(() => {
    feedbackRef.current = null;
    globalFeedbackRef = null;
    notify();
  }, [notify]);

  const showError = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    const feedback: Feedback = {
      type: 'error',
      title: title || 'Erro',
      message,
      action: action || { label: 'Entendi', onClick: clearFeedback },
      persistent: true
    };
    feedbackRef.current = feedback;
    globalFeedbackRef = feedback;
    notify();
  }, [notify, clearFeedback]);

  const showSuccess = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    const feedback: Feedback = {
      type: 'success',
      title: title || 'Sucesso',
      message,
      action: action || { label: 'OK', onClick: clearFeedback },
      persistent: true
    };
    feedbackRef.current = feedback;
    globalFeedbackRef = feedback;
    notify();
  }, [notify, clearFeedback]);

  const showWarning = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    const feedback: Feedback = {
      type: 'warning',
      title: title || 'Atenção',
      message,
      action: action || { label: 'Entendi', onClick: clearFeedback },
      persistent: true
    };
    feedbackRef.current = feedback;
    globalFeedbackRef = feedback;
    notify();
  }, [notify, clearFeedback]);

  const showInfo = useCallback((message: string, title?: string, action?: Feedback['action']) => {
    const feedback: Feedback = {
      type: 'info',
      title: title || 'Informação',
      message,
      action: action || { label: 'OK', onClick: clearFeedback },
      persistent: true
    };
    feedbackRef.current = feedback;
    globalFeedbackRef = feedback;
    notify();
  }, [notify, clearFeedback]);

  const showFeedback = useCallback((fb: Feedback) => {
    const feedback = {
      ...fb,
      persistent: fb.persistent !== false
    };
    feedbackRef.current = feedback;
    globalFeedbackRef = feedback;
    notify();
  }, [notify]);

  return (
    <FeedbackContext.Provider value={{
      getFeedback,
      isModalOpen,
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
    isModalOpen: context.isModalOpen,
    showError: context.showError,
    showSuccess: context.showSuccess,
    showWarning: context.showWarning,
    showInfo: context.showInfo,
    showFeedback: context.showFeedback,
    clearFeedback: context.clearFeedback
  };
}
