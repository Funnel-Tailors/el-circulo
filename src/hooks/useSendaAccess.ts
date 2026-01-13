import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { QuizState } from '@/types/quiz';

interface JourneyState {
  isExpiredOrScheduled: boolean;
  callScheduledAt: Date | null;
  journeyCompleted: boolean;
}

export const useSendaAccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState<string | null>(null);
  const [journeyState, setJourneyState] = useState<JourneyState>({
    isExpiredOrScheduled: false,
    callScheduledAt: null,
    journeyCompleted: false
  });

  useEffect(() => {
    const validateToken = async () => {
      const tokenParam = searchParams.get('token');
      
      if (!tokenParam) {
        console.log('⚠️ No token provided - loading with default copy');
        setQuizState(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        // 1. Verificar blacklist PRIMERO
        const { data: blacklistData, error: blacklistError } = await supabase
          .from('senda_blacklist')
          .select('reason')
          .eq('ghl_contact_id', tokenParam)
          .single();

        if (blacklistError && blacklistError.code !== 'PGRST116') {
          console.error('❌ Error checking blacklist:', blacklistError.message);
        }

        if (blacklistData) {
          console.log('🚫 Token blacklisted:', tokenParam);
          setIsBlacklisted(true);
          setBlacklistReason(blacklistData.reason);
          setToken(tokenParam);
          setLoading(false);

          // Fire-and-forget: trackear intento de acceso bloqueado
          supabase.from('quiz_analytics').insert({
            session_id: tokenParam,
            event_type: 'senda_blacklisted_access_attempt',
            quiz_version: 'v2'
          }).then(({ error }) => {
            if (error) {
              console.error('❌ Error tracking blacklist attempt:', error.message);
            } else {
              console.log('✅ Tracked: senda_blacklisted_access_attempt');
            }
          });
          return;
        }

        // 2. Check senda_progress for journey state
        const { data: progressData } = await supabase
          .from('senda_progress')
          .select('first_visit_at, call_scheduled_at, journey_completed, access_expires_at, access_paused, timer_reset_at')
          .eq('ghl_contact_id', tokenParam)
          .single();

        if (progressData) {
          let isExpiredOrScheduled = false;
          let callScheduledAt: Date | null = null;

          // Check if access is paused
          if (progressData.access_paused) {
            console.log('⏸️ Access paused for:', tokenParam);
            isExpiredOrScheduled = true;
          }
          // Check if journey is completed
          else if (progressData.journey_completed) {
            setJourneyState({
              isExpiredOrScheduled: false,
              callScheduledAt: null,
              journeyCompleted: true
            });
          } else {
            // Check for scheduled call
            if (progressData.call_scheduled_at) {
              callScheduledAt = new Date(progressData.call_scheduled_at);
              isExpiredOrScheduled = true;
            }
            // Check for expiration with timer control support
            // Priority: 1. access_expires_at, 2. timer_reset_at + 48h, 3. first_visit_at + 48h
            else {
              let expirationDate: Date | null = null;
              
              if (progressData.access_expires_at) {
                expirationDate = new Date(progressData.access_expires_at);
              } else if (progressData.timer_reset_at) {
                expirationDate = new Date(progressData.timer_reset_at);
                expirationDate.setHours(expirationDate.getHours() + 48);
              } else if (progressData.first_visit_at) {
                expirationDate = new Date(progressData.first_visit_at);
                expirationDate.setHours(expirationDate.getHours() + 48);
              }

              if (expirationDate && new Date() > expirationDate) {
                isExpiredOrScheduled = true;
              }
            }

            setJourneyState({
              isExpiredOrScheduled,
              callScheduledAt,
              journeyCompleted: false
            });
          }
        }

        // 3. Validar token normal
        const { data, error } = await supabase
          .from('quiz_analytics')
          .select('quiz_state, session_id')
          .eq('ghl_contact_id', tokenParam)
          .eq('event_type', 'contact_form_submitted')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data || !data.quiz_state) {
          console.log('⚠️ Invalid token or no quiz data - loading with default copy');
          setQuizState(null);
          setToken(null);
          setLoading(false);
          return;
        }

        setQuizState(data.quiz_state as unknown as QuizState);
        setToken(tokenParam);
        
        console.log('✅ Senda access validated:', {
          token: tokenParam,
          quizState: data.quiz_state,
          journeyState
        });

        setLoading(false);

        // Fire-and-forget: trackear page view
        supabase.from('quiz_analytics').insert({
          session_id: tokenParam,
          event_type: 'senda_page_view',
          quiz_version: 'v2'
        }).then(({ error: insertError }) => {
          if (insertError) {
            console.error('❌ Error tracking senda_page_view:', insertError.message, insertError.code);
          } else {
            console.log('✅ Tracked: senda_page_view for', tokenParam);
          }
        });
        
      } catch (err) {
        console.error('❌ Error validating token:', err);
        setQuizState(null);
        setToken(null);
        setLoading(false);
      }
    };

    validateToken();
  }, [searchParams]);

  return { 
    loading, 
    quizState, 
    token, 
    isBlacklisted, 
    blacklistReason,
    // Journey state
    isExpiredOrScheduled: journeyState.isExpiredOrScheduled,
    callScheduledAt: journeyState.callScheduledAt,
    journeyCompleted: journeyState.journeyCompleted
  };
};
