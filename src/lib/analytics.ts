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
  | 'error_occurred'
  | 'video_testimonial_click'
  | 'video_testimonial_complete'
  | 'vsl_25_percent'
  | 'vsl_50_percent'
  | 'vsl_75_percent'
  | 'vsl_100_percent'
  | 'senda_page_view'
  | 'senda_video_start'
  | 'senda_video_progress_25'
  | 'senda_video_progress_50'
  | 'senda_video_progress_75'
  | 'senda_video_complete'
  | 'senda_pdf_download'
  | 'senda_ai_assistant_open'
  | 'skeptic_challenged'
  | 'skeptic_converted';

interface TrackEventParams {
  event_type: EventType;
  step_index?: number;
  step_id?: string;
  answer_value?: string;
  time_spent_seconds?: number;
  error_type?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

class QuizAnalytics {
  private sessionId: string;
  private userJourneyId: string;
  public utmParams: Record<string, string>; // Make public for access in QuizSection
  private fbclid: string | null;
  private referrer: string;
  public deviceType: string; // Make public for access in QuizSection
  private language: string;
  private startTime: number;
  private stepStartTimes: Map<string, number>;
  private vslMilestones: Set<number>;
  private quizVersion: string = 'v2'; // Nueva versión del quiz con Q1 de pain point
  private geoData: {
    city?: string;
    region?: string;
    postal?: string;
    country_code?: string;
  } | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userJourneyId = this.getOrCreateJourneyId();
    this.utmParams = this.captureUTMParams();
    this.referrer = document.referrer || 'direct';
    this.deviceType = this.getDeviceType();
    this.language = navigator.language || 'unknown';
    this.startTime = Date.now();
    this.stepStartTimes = new Map();
    this.vslMilestones = new Set();
    
    // Inicializar Meta Pixel con advanced matching (síncrono, necesario antes de eventos)
    this.initMetaPixel();
    
    // Diferir geolocalización para no bloquear render inicial
    if (typeof window !== 'undefined') {
      // Usar requestIdleCallback si disponible, sino setTimeout con 100ms
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => this.initGeoData());
      } else {
        setTimeout(() => this.initGeoData(), 100);
      }
    }
  }

  private getOrCreateSessionId(): string {
    const existingId = sessionStorage.getItem('quiz_session_id');
    if (existingId) return existingId;

    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('quiz_session_id', newId);
    return newId;
  }

  private getOrCreateJourneyId(): string {
    const existingId = localStorage.getItem('user_journey_id');
    if (existingId) return existingId;

    const newId = `journey_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('user_journey_id', newId);
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

  /**
   * Inicializa Meta Pixel con Advanced Matching
   * Se ejecuta en constructor después de capturar todos los datos técnicos disponibles
   * - external_id: session_id para tracking cross-device
   * - fbc: Facebook Click cookie si viene de un ad
   * - fbp: Facebook Browser Pixel cookie
   */
  private initMetaPixel(): void {
    if (typeof window === 'undefined' || !(window as any).fbq) {
      console.warn('⚠️ Meta Pixel no disponible en init');
      return;
    }

    try {
      // Construir advanced matching con datos técnicos disponibles en init
      const advancedMatching: any = {};

      // 1. External ID (session_id) - siempre disponible
      advancedMatching.external_id = this.sessionId;

      // 2. Facebook Click cookie (fbc) - si tenemos fbclid
      if (this.fbclid) {
        const timestamp = Date.now();
        advancedMatching.fbc = `fb.1.${timestamp}.${this.fbclid}`;
      }

      // 3. Facebook Browser Pixel cookie (fbp) - leer de cookies
      const fbpCookie = this.getFBPCookie();
      if (fbpCookie) {
        advancedMatching.fbp = fbpCookie;
      }

      // Inicializar pixel con advanced matching
      (window as any).fbq('init', '557247343765576', advancedMatching);
      
      // Disparar PageView inicial
      (window as any).fbq('track', 'PageView');

      console.log('🎯 Meta Pixel inicializado con advanced matching:', {
        pixelId: '557247343765576',
        matching: advancedMatching,
        geo_available: this.geoData !== null
      });
    } catch (error) {
      console.error('❌ Error inicializando Meta Pixel:', error);
    }
  }

  /**
   * Inicializa la geolocalización usando ipapi.co
   * - Intenta cargar desde sessionStorage (caché)
   * - Si no existe, fetch a ipapi.co con timeout de 2s
   * - Si falla, continúa sin geo data (no rompe nada)
   */
  private async initGeoData(): Promise<void> {
    try {
      // 1. Intentar cargar desde sessionStorage (caché)
      const cached = sessionStorage.getItem('user_geo_data');
      if (cached) {
        this.geoData = JSON.parse(cached);
        console.log('📍 Geo data cargada desde caché:', this.geoData);
        return;
      }

      // 2. Fetch con timeout de 2 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Geo API failed');

      const data = await response.json();
      
      // 3. Mapear a formato compatible con Meta Pixel
      this.geoData = {
        city: data.city?.toLowerCase(),
        region: data.region_code?.toLowerCase(), 
        postal: data.postal,
        country_code: data.country_code?.toLowerCase()
      };

      // 4. Guardar en sessionStorage para toda la sesión
      sessionStorage.setItem('user_geo_data', JSON.stringify(this.geoData));
      
      console.log('📍 Geo data obtenida de API:', this.geoData);

    } catch (error) {
      // Si falla, no pasa nada - continuamos sin geo data
      console.log('⚠️ Geo data no disponible (continuando sin ella):', error);
      this.geoData = null;
    }
  }

  async trackEvent(params: TrackEventParams): Promise<void> {
    try {
      const payload = {
        session_id: this.sessionId,
        user_journey_id: this.userJourneyId,
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
        quiz_version: this.quizVersion, // Diferenciar versiones v1 vs v2
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

  /**
   * Obtiene la cookie _fbp generada automáticamente por Meta Pixel
   * Formato típico: fb.1.1554763741205.1234567890
   */
  private getFBPCookie(): string | null {
    const match = document.cookie.match(/_fbp=([^;]+)/);
    return match ? match[1] : null;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getUserJourneyId(): string {
    return this.userJourneyId;
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

  // Meta Pixel Tracking Methods
  async trackMetaPixelEvent(eventName: string, params: any): Promise<void> {
    // Generar event_id único para deduplicación
    const eventId = `${this.sessionId}_${eventName}_${Date.now()}`;
    
    // 1. Disparar a Meta Pixel (browser-side) con Advanced Matching y event_id
    if (typeof window !== 'undefined' && (window as any).fbq) {
      // Construir objeto de advanced matching con parámetros técnicos
      const advancedMatching: any = {};

      // 1. External ID (session_id) - siempre disponible
      advancedMatching.external_id = this.sessionId;

      // 2. Facebook Click cookie (fbc) - si tenemos fbclid
      if (this.fbclid) {
        // Formato: fb.1.{timestamp}.{fbclid}
        const timestamp = Date.now();
        advancedMatching.fbc = `fb.1.${timestamp}.${this.fbclid}`;
      }

      // 3. Facebook Browser Pixel cookie (fbp) - leer de cookies
      const fbpCookie = this.getFBPCookie();
      if (fbpCookie) {
        advancedMatching.fbp = fbpCookie;
      }

      // 4. Geo data (ciudad, región, postal, país) - si disponible
      if (this.geoData) {
        if (this.geoData.city) advancedMatching.ct = this.geoData.city;
        if (this.geoData.region) advancedMatching.st = this.geoData.region;
        if (this.geoData.postal) advancedMatching.zp = this.geoData.postal;
        if (this.geoData.country_code) advancedMatching.country = this.geoData.country_code;
      }

      // Agregar event_id a parámetros para deduplicación
      const enrichedParams = {
        ...params,
        eventID: eventId
      };

      // Enviar evento con advanced matching como tercer parámetro
      (window as any).fbq('track', eventName, enrichedParams, advancedMatching);
      
      console.log(`🎯 Meta Pixel ${eventName} con advanced matching + event_id:`, {
        eventName,
        eventId,
        params: enrichedParams,
        matching: {
          ...advancedMatching,
          geo_available: !!this.geoData // Flag para debugging
        }
      });
    } else {
      console.warn('⚠️ Meta Pixel no disponible');
    }
    
    // 2. Guardar en Supabase para analytics
    try {
      // Convertir content_ids a array si no lo es
      const contentIds = params.content_ids 
        ? (Array.isArray(params.content_ids) ? params.content_ids : [params.content_ids])
        : null;

      const eventId = `${this.sessionId}_${eventName}_${Date.now()}`;
      
      const { data, error } = await supabase.from('meta_pixel_events').insert({
        session_id: this.sessionId,
        user_journey_id: this.userJourneyId,
        event_name: eventName,
        event_id: eventId,
        event_value: params.value || null,
        content_category: params.content_category || null,
        content_ids: contentIds,
        custom_data: {
          ...params.custom_data,
          // Incluir métricas predictivas en el custom_data guardado en DB
          predicted_ltv: params.predicted_ltv || null,
          conversion_probability: params.custom_data?.conversion_probability || null,
          show_up_probability: params.custom_data?.show_up_probability || null,
        },
        quiz_version: this.quizVersion
      });

      if (error) {
        console.error('❌ Error guardando Meta event en DB:', error);
        throw error;
      }
      
      console.log('✅ Meta event guardado en DB:', eventName);
    } catch (err) {
      console.error('❌ Exception guardando Meta event:', err);
      throw err;
    }
  }

  async trackQuizEngagement(): Promise<void> {
    await this.trackMetaPixelEvent('ViewContent', {
      content_type: 'quiz',
      content_name: 'Quiz Started - First Answer',
      content_category: 'lead_generation',
      value: 200,
      currency: 'EUR'
    });
  }

  async trackPainPoint(painPoint: string): Promise<void> {
    await this.trackMetaPixelEvent('ViewContent', {
      content_type: 'quiz',
      content_name: 'Pain Point Identified',
      content_category: 'lead_qualification',
      value: 150,
      currency: 'EUR',
      custom_data: {
        pain_point: painPoint
      }
    });
  }

  async trackICPMatch(projectValue: string): Promise<void> {
    if (projectValue === "1.000€ - 2.500€") {
      await this.trackMetaPixelEvent('ViewContent', {
        content_type: 'quiz',
        content_name: 'ICP Sweet Spot Match',
        content_category: 'high_intent_lead',
        value: 800,
        currency: 'EUR',
        content_ids: ['icp_1k_2.5k']
      });
    }
  }

  async trackLowRevenueDisqualified(): Promise<void> {
    await this.trackMetaPixelEvent('ViewContent', {
      content_type: 'quiz_disqualified',
      content_name: 'Disqualified - Low Revenue',
      content_category: 'negative_signal',
      value: 0,
      currency: 'EUR',
      content_ids: ['disqualified_low_revenue']
    });
  }

  async trackBudgetDisqualified(): Promise<void> {
    await this.trackMetaPixelEvent('ViewContent', {
      content_type: 'quiz_disqualified',
      content_name: 'Disqualified - No Budget',
      content_category: 'negative_signal',
      value: 0,
      currency: 'EUR',
      content_ids: ['disqualified_no_budget']
    });
  }

  trackBudgetQualified(investmentCapacity: string): void {
    // Meta Pixel AddToCart ya se dispara en handleNext con valores graduados
    // Solo registramos en quiz_analytics para tracking interno
    this.trackEvent({
      event_type: 'question_answered',
      step_id: 'q4_budget_qualified',
      answer_value: investmentCapacity,
      metadata: {
        meta_event: 'AddToCart',
        investment_capacity: investmentCapacity
      }
    });
  }

  async enrichLeadEvent(value: number, icp_match: boolean, revenue_range: string, budget_ready: boolean): Promise<void> {
    await this.trackMetaPixelEvent('Lead', {
      value: value,
      currency: 'EUR',
      content_name: 'Círculo Membership',
      content_category: icp_match ? 'qualified_lead' : 'standard_lead',
      predicted_ltv: value * 3,
      content_ids: ['circulo_lead']
    });
  }

  // VSL Tracking Methods
  async trackVSLView(vslType: 'roadmap_hero' | 'booking_iframe'): Promise<void> {
    try {
      const { error } = await supabase.from('vsl_views').insert({
        session_id: this.sessionId,
        user_journey_id: this.userJourneyId,
        vsl_type: vslType,
        utm_source: this.utmParams.utm_source,
        utm_medium: this.utmParams.utm_medium,
        utm_campaign: this.utmParams.utm_campaign,
        device_type: this.deviceType,
        referrer: this.referrer,
        quiz_version: this.quizVersion, // Diferenciar versiones v1 vs v2
      });

      if (error) {
        console.error('VSL tracking error:', error);
      }
    } catch (err) {
      console.error('VSL tracking exception:', err);
    }
  }

  async trackVSLProgress(percentage: number, duration: number): Promise<void> {
    // Solo actualizar en hitos clave: 25%, 50%, 75%, 100%
    const milestones = [25, 50, 75, 100];
    const currentMilestone = milestones.find(m => percentage >= m && !this.vslMilestones.has(m));
    
    if (!currentMilestone) return;

    // Marcar hito como alcanzado
    this.vslMilestones.add(currentMilestone);

    try {
      // 1. Buscar el registro más reciente para esta sesión
      const { data: latestView, error: selectError } = await supabase
        .from('vsl_views')
        .select('id')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError || !latestView) {
        console.error('No VSL view found for session:', this.sessionId, selectError);
        return;
      }

      // 2. Actualizar SOLO ese registro específico por ID
      const { error: updateError } = await supabase
        .from('vsl_views')
        .update({
          video_percentage_watched: currentMilestone, // Guardar el milestone alcanzado
          view_duration_seconds: duration,
          user_interacted: true,
        })
        .eq('id', latestView.id);

      if (updateError) {
        console.error('VSL progress tracking error:', updateError);
      } else {
        console.log(`✅ VSL milestone tracked: ${currentMilestone}% (duration: ${duration}s)`);
      }

      // 3. Registrar evento en quiz_analytics para que aparezca en el tab de analytics
      await this.trackEvent({
        event_type: `vsl_${currentMilestone}_percent` as any,
        metadata: {
          milestone: currentMilestone,
          duration: duration,
          vsl_view_id: latestView.id
        }
      });

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
