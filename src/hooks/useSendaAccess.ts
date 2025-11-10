import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { QuizState } from '@/types/quiz';

export const useSendaAccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const tokenParam = searchParams.get('token');
      
      if (!tokenParam) {
        console.error('❌ No token provided');
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quiz_analytics')
          .select('quiz_state, session_id')
          .eq('session_id', tokenParam)
          .eq('event_type', 'contact_form_submitted')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data || !data.quiz_state) {
          console.error('❌ Invalid token or no quiz data found:', error);
          navigate('/');
          return;
        }

        setQuizState(data.quiz_state as QuizState);
        setToken(tokenParam);
        
        console.log('✅ Senda access validated:', {
          token: tokenParam,
          quizState: data.quiz_state
        });

        await supabase.from('quiz_analytics').insert({
          session_id: tokenParam,
          event_type: 'senda_page_view',
          quiz_version: 'v2'
        });
        
      } catch (err) {
        console.error('❌ Error validating token:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [searchParams, navigate]);

  return { loading, quizState, token };
};
