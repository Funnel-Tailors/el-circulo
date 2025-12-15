import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { QuizState } from '@/types/quiz';

export const useSendaAccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState<string | null>(null);

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
        const { data: blacklistData } = await supabase
          .from('senda_blacklist')
          .select('reason')
          .eq('ghl_contact_id', tokenParam)
          .single();

        if (blacklistData) {
          console.log('🚫 Token blacklisted:', tokenParam);
          setIsBlacklisted(true);
          setBlacklistReason(blacklistData.reason);
          setToken(tokenParam);
          setLoading(false);

          // Trackear intento de acceso bloqueado
          await supabase.from('quiz_analytics').insert({
            session_id: tokenParam,
            event_type: 'senda_blacklisted_access_attempt',
            quiz_version: 'v2'
          });
          return;
        }

        // 2. Validar token normal
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
          quizState: data.quiz_state
        });

        setLoading(false);

        await supabase.from('quiz_analytics').insert({
          session_id: tokenParam,
          event_type: 'senda_page_view',
          quiz_version: 'v2'
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

  return { loading, quizState, token, isBlacklisted, blacklistReason };
};
