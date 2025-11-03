import { supabase } from '@/integrations/supabase/client';

type EventType =
  | 'quiz_started'
  | 'question_viewed'
  | 'question_answered'
  | 'contact_form_viewed'
  | 'contact_form_submitted'
  | 'validation_error'
  | 'quiz_abandoned'
  | 'quiz_completed'
  | 'error_occurred';

interface TrackEventParams {
  event_type: EventType;
  step_index?: number;
  step_id?: string;
  answer_value?: string;
  time_spent_seconds?: number;
  error_type?: string;
  error_message?: string;
}

class QuizAnalytics {
  private sessionId: string;
  private utmParams: Record<string, string>;
  private fbclid: string | null;
  private referrer: string;
  private deviceType: string;
  private language: string;
  private startTime: number;
  private stepStartTimes: Map<string, number>;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.utmParams = this.captureUTMParams();
    this.referrer = document.referrer || 'direct';
    this.deviceType = this.getDeviceType();
    this.language = navigator.language || 'unknown';
    this.startTime = Date.now();
    this.stepStartTimes = new Map();
  }

  private getOrCreateSessionId(): string {
    const existingId = sessionStorage.getItem('quiz_session_id');
    if (existingId) return existingId;

    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('quiz_session_id', newId);
    return newId;
  }

  private captureUTMParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      const value = params.get(key);
      if (value) {
        utmParams[key] = value;
        sessionStorage.setItem(key, value);
      } else {
        const stored = sessionStorage.getItem(key);
        if (stored) utmParams[key] = stored;
      }
    });

    // Capturar fbclid para CAPI de Facebook
    const fbclidValue = params.get('fbclid');
    if (fbclidValue) {
      this.fbclid = fbclidValue;
      sessionStorage.setItem('fbclid', fbclidValue);
    } else {
      this.fbclid = sessionStorage.getItem('fbclid');
    }

    return utmParams;
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  async trackEvent(params: TrackEventParams): Promise<void> {
    try {
      const payload = {
        session_id: this.sessionId,
        event_type: params.event_type,
        step_index: params.step_index,
        step_id: params.step_id,
        answer_value: params.answer_value,
        time_spent_seconds: params.time_spent_seconds,
        error_type: params.error_type,
        error_message: params.error_message,
        device_type: this.deviceType,
        language: this.language,
        utm_source: this.utmParams.utm_source,
        utm_medium: this.utmParams.utm_medium,
        utm_campaign: this.utmParams.utm_campaign,
        utm_term: this.utmParams.utm_term,
        utm_content: this.utmParams.utm_content,
        referrer: this.referrer,
      };

      console.log('📤 Sending analytics event:', {
        event_type: params.event_type,
        session_id: this.sessionId,
        step_id: params.step_id
      });

      const { error } = await supabase.from('quiz_analytics').insert(payload);

      if (error) {
        console.error('❌ Analytics tracking error:', error);
        throw error;
      }

      console.log('✅ Event tracked successfully:', params.event_type);
    } catch (err) {
      console.error('❌ Analytics tracking exception:', err);
      throw err;
    }
  }

  startStep(stepId: string, stepIndex: number): void {
    this.stepStartTimes.set(stepId, Date.now());
    this.trackEvent({
      event_type: 'question_viewed',
      step_id: stepId,
      step_index: stepIndex,
    });
  }

  answerStep(stepId: string, stepIndex: number, answerValue: string): void {
    const startTime = this.stepStartTimes.get(stepId);
    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : undefined;

    this.trackEvent({
      event_type: 'question_answered',
      step_id: stepId,
      step_index: stepIndex,
      answer_value: typeof answerValue === 'object' ? JSON.stringify(answerValue) : String(answerValue),
      time_spent_seconds: timeSpent,
    });
  }

  trackValidationError(stepId: string, errorType: string, errorMessage: string): void {
    this.trackEvent({
      event_type: 'validation_error',
      step_id: stepId,
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  trackError(errorType: string, errorMessage: string, stepId?: string): void {
    this.trackEvent({
      event_type: 'error_occurred',
      step_id: stepId,
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  trackAbandonment(currentStepId?: string, currentStepIndex?: number): void {
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    this.trackEvent({
      event_type: 'quiz_abandoned',
      step_id: currentStepId,
      step_index: currentStepIndex,
      time_spent_seconds: timeSpent,
    });
  }

  completeQuiz(): void {
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('📊 Tracking quiz completion:', {
      sessionId: this.sessionId,
      timeSpent,
      deviceType: this.deviceType,
      utmSource: this.utmParams.utm_source,
      timestamp: new Date().toISOString()
    });

    this.trackEvent({
      event_type: 'quiz_completed',
      time_spent_seconds: timeSpent,
    }).catch(error => {
      console.error('❌ Failed to track quiz completion:', error);
    });
  }

  async submitContactForm(): Promise<void> {
    console.log('📝 Tracking contact form submission:', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    });
    
    try {
      await this.trackEvent({
        event_type: 'contact_form_submitted',
      });
      console.log('✅ Contact form submission tracked successfully');
    } catch (error) {
      console.error('❌ Failed to track contact form submission:', error);
      throw error;
    }
  }

  viewContactForm(): void {
    this.trackEvent({
      event_type: 'contact_form_viewed',
    });
  }

  getFbclid(): string | null {
    return this.fbclid;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Quiz Start Tracking Methods
  hasTrackedQuizStart(): boolean {
    return sessionStorage.getItem('quiz_start_tracked') === 'true';
  }

  markQuizStartTracked(): void {
    sessionStorage.setItem('quiz_start_tracked', 'true');
  }

  trackQuizStart(): void {
    if (!this.hasTrackedQuizStart()) {
      this.trackEvent({ event_type: 'quiz_started' });
      this.markQuizStartTracked();
    }
  }

  // VSL Tracking Methods
  async trackVSLView(vslType: 'roadmap_hero' | 'booking_iframe'): Promise<void> {
    try {
      const { error } = await supabase.from('vsl_views').insert({
        session_id: this.sessionId,
        vsl_type: vslType,
        utm_source: this.utmParams.utm_source,
        utm_medium: this.utmParams.utm_medium,
        utm_campaign: this.utmParams.utm_campaign,
        device_type: this.deviceType,
        referrer: this.referrer,
      });

      if (error) {
        console.error('VSL tracking error:', error);
      }
    } catch (err) {
      console.error('VSL tracking exception:', err);
    }
  }

  async trackVSLProgress(percentage: number, duration: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('vsl_views')
        .update({
          video_percentage_watched: percentage,
          view_duration_seconds: duration,
          user_interacted: true,
        })
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('VSL progress tracking error:', error);
      }
    } catch (err) {
      console.error('VSL progress tracking exception:', err);
    }
  }

  async linkVSLtoContact(ghlContactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vsl_views')
        .update({ ghl_contact_id: ghlContactId })
        .eq('session_id', this.sessionId)
        .is('ghl_contact_id', null);

      if (error) {
        console.error('VSL contact linking error:', error);
      }
    } catch (err) {
      console.error('VSL contact linking exception:', err);
    }
  }
}

export const quizAnalytics = new QuizAnalytics();
