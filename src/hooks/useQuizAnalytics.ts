import { useEffect } from 'react';
import { quizAnalytics } from '@/lib/analytics';
import { QuizState } from '@/types/quiz';

interface UseQuizAnalyticsConfig {
  quizState: QuizState;
  isQualified: boolean;
  enabled?: boolean;
}

/**
 * Hook para encapsular todo el tracking de analytics del quiz.
 * Centraliza el tracking de completion, VSL linking, y otros eventos.
 */
export const useQuizAnalytics = ({
  quizState,
  isQualified,
  enabled = true
}: UseQuizAnalyticsConfig) => {
  // Track quiz completion (solo una vez al montar)
  useEffect(() => {
    if (!enabled) return;

    console.log('✅ Quiz analytics initialized - tracking completion', {
      quizVersion: 'v2',
      sessionId: quizAnalytics.getSessionId(),
      isQualified,
      hasEmail: !!quizState.email,
      hasWhatsapp: !!quizState.whatsapp
    });

    quizAnalytics.completeQuiz();
  }, []); // Solo una vez al montar - NO agregar dependencies

  // Link VSL views to GHL contact when available
  useEffect(() => {
    if (!enabled) return;
    if (!quizState.ghlContactId) return;

    console.log('🔗 Linking VSL views to GHL contact:', quizState.ghlContactId);
    quizAnalytics.linkVSLtoContact(quizState.ghlContactId);
  }, [quizState.ghlContactId, enabled]);

  return {
    sessionId: quizAnalytics.getSessionId(),
    userJourneyId: quizAnalytics.getUserJourneyId()
  };
};
