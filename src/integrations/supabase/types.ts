export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_insights: {
        Row: {
          created_at: string
          date_range_end: string
          date_range_start: string
          generated_by: string | null
          id: string
          insights: Json
          interval_days: number
          raw_data: Json
        }
        Insert: {
          created_at?: string
          date_range_end: string
          date_range_start: string
          generated_by?: string | null
          id?: string
          insights: Json
          interval_days: number
          raw_data: Json
        }
        Update: {
          created_at?: string
          date_range_end?: string
          date_range_start?: string
          generated_by?: string | null
          id?: string
          insights?: Json
          interval_days?: number
          raw_data?: Json
        }
        Relationships: []
      }
      meta_pixel_events: {
        Row: {
          content_category: string | null
          content_ids: string[] | null
          created_at: string | null
          custom_data: Json | null
          event_name: string
          event_value: number | null
          id: string
          quiz_version: string | null
          session_id: string
          user_journey_id: string | null
        }
        Insert: {
          content_category?: string | null
          content_ids?: string[] | null
          created_at?: string | null
          custom_data?: Json | null
          event_name: string
          event_value?: number | null
          id?: string
          quiz_version?: string | null
          session_id: string
          user_journey_id?: string | null
        }
        Update: {
          content_category?: string | null
          content_ids?: string[] | null
          created_at?: string | null
          custom_data?: Json | null
          event_name?: string
          event_value?: number | null
          id?: string
          quiz_version?: string | null
          session_id?: string
          user_journey_id?: string | null
        }
        Relationships: []
      }
      quiz_analytics: {
        Row: {
          answer_value: string | null
          created_at: string
          device_type: string | null
          error_message: string | null
          error_type: string | null
          event_type: string
          id: string
          language: string | null
          quiz_state: Json | null
          quiz_version: string | null
          referrer: string | null
          session_id: string
          step_id: string | null
          step_index: number | null
          time_spent_seconds: number | null
          user_journey_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          answer_value?: string | null
          created_at?: string
          device_type?: string | null
          error_message?: string | null
          error_type?: string | null
          event_type: string
          id?: string
          language?: string | null
          quiz_state?: Json | null
          quiz_version?: string | null
          referrer?: string | null
          session_id: string
          step_id?: string | null
          step_index?: number | null
          time_spent_seconds?: number | null
          user_journey_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          answer_value?: string | null
          created_at?: string
          device_type?: string | null
          error_message?: string | null
          error_type?: string | null
          event_type?: string
          id?: string
          language?: string | null
          quiz_state?: Json | null
          quiz_version?: string | null
          referrer?: string | null
          session_id?: string
          step_id?: string | null
          step_index?: number | null
          time_spent_seconds?: number | null
          user_journey_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vsl_views: {
        Row: {
          created_at: string | null
          device_type: string | null
          ghl_contact_id: string | null
          id: string
          quiz_version: string | null
          referrer: string | null
          session_id: string
          user_interacted: boolean | null
          user_journey_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          video_percentage_watched: number | null
          view_duration_seconds: number | null
          view_started_at: string | null
          vsl_type: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          ghl_contact_id?: string | null
          id?: string
          quiz_version?: string | null
          referrer?: string | null
          session_id: string
          user_interacted?: boolean | null
          user_journey_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          video_percentage_watched?: number | null
          view_duration_seconds?: number | null
          view_started_at?: string | null
          vsl_type: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          ghl_contact_id?: string | null
          id?: string
          quiz_version?: string | null
          referrer?: string | null
          session_id?: string
          user_interacted?: boolean | null
          user_journey_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          video_percentage_watched?: number | null
          view_duration_seconds?: number | null
          view_started_at?: string | null
          vsl_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      quiz_answer_distribution: {
        Row: {
          answer_value: string | null
          percentage: number | null
          response_count: number | null
          step_id: string | null
          step_index: number | null
        }
        Relationships: []
      }
      quiz_conversion_by_step: {
        Row: {
          conversion_rate_percent: number | null
          previous_step_sessions: number | null
          sessions_reached: number | null
          step_id: string | null
          step_index: number | null
        }
        Relationships: []
      }
      quiz_funnel_by_version: {
        Row: {
          quiz_version: string | null
          reached_q3: number | null
          reached_q5: number | null
          saw_form: number | null
          started: number | null
          submitted: number | null
        }
        Relationships: []
      }
      quiz_funnel_stats: {
        Row: {
          avg_time_seconds: number | null
          event_type: string | null
          step_id: string | null
          total_events: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      quiz_kpis: {
        Row: {
          abandoned_sessions: number | null
          avg_time_to_complete: number | null
          completed_sessions: number | null
          conversion_rate: number | null
          started_sessions: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      quiz_step_metrics: {
        Row: {
          answer_rate: number | null
          answers: number | null
          avg_time_seconds: number | null
          step_id: string | null
          step_index: number | null
          views: number | null
        }
        Relationships: []
      }
      quiz_utm_performance: {
        Row: {
          conversion_rate: number | null
          conversions: number | null
          sessions: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Relationships: []
      }
      quiz_version_comparison: {
        Row: {
          completion_rate: number | null
          completions: number | null
          conversion_rate: number | null
          date: string | null
          leads: number | null
          quiz_version: string | null
          total_sessions: number | null
        }
        Relationships: []
      }
      session_funnel: {
        Row: {
          completed: number | null
          overall_conversion_rate: number | null
          quiz_completion_rate: number | null
          quiz_started: number | null
          reached_contact_form: number | null
          reached_q1: number | null
          session_to_quiz_rate: number | null
          total_sessions: number | null
          vsl_views: number | null
        }
        Relationships: []
      }
      vsl_performance_kpis: {
        Row: {
          avg_duration_seconds: number | null
          avg_percentage_watched: number | null
          engaged_viewers: number | null
          engagement_rate: number | null
          quiz_completed: number | null
          quiz_started: number | null
          total_vsl_views: number | null
          vsl_to_conversion_rate: number | null
          vsl_to_quiz_rate: number | null
        }
        Relationships: []
      }
      vsl_watch_brackets: {
        Row: {
          completed_quiz: number | null
          conversion_rate: number | null
          viewers: number | null
          watch_bracket: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_analytics_overview: {
        Args: {
          filter_quiz_version?: string
          interval_days: number
          offset_days?: number
        }
        Returns: Json
      }
      get_answer_distribution_filtered:
        | {
            Args: { interval_days: number }
            Returns: {
              answer_value: string
              percentage: number
              response_count: number
              step_id: string
              step_index: number
            }[]
          }
        | {
            Args: { interval_days: number; quiz_version_filter?: string }
            Returns: {
              answer_value: string
              percentage: number
              response_count: number
              step_id: string
              step_index: number
            }[]
          }
      get_daily_trends: {
        Args: { interval_days: number }
        Returns: {
          avg_vsl_engagement: number
          conversion_rate: number
          date: string
          leads_count: number
          quiz_completion_rate: number
        }[]
      }
      get_meta_events_journey: {
        Args: {
          filter_quiz_version?: string
          interval_days: number
          offset_days?: number
        }
        Returns: Json
      }
      get_quiz_conversion_by_step_filtered: {
        Args: { interval_days: number }
        Returns: {
          conversion_rate_percent: number
          previous_step_sessions: number
          sessions_reached: number
          step_id: string
          step_index: number
        }[]
      }
      get_quiz_kpis_filtered:
        | {
            Args: { interval_days: number }
            Returns: {
              abandoned_sessions: number
              avg_time_to_complete: number
              completed_sessions: number
              conversion_rate: number
              started_sessions: number
              total_sessions: number
            }[]
          }
        | {
            Args: { interval_days: number; offset_days?: number }
            Returns: {
              abandoned_sessions: number
              avg_time_to_complete: number
              completed_sessions: number
              conversion_rate: number
              started_sessions: number
              total_sessions: number
            }[]
          }
      get_quiz_step_metrics_filtered: {
        Args: { interval_days: number }
        Returns: {
          answer_rate: number
          answers: number
          avg_time_seconds: number
          step_id: string
          step_index: number
          views: number
        }[]
      }
      get_session_funnel_filtered:
        | {
            Args: { interval_days: number }
            Returns: {
              form_submission_rate: number
              overall_conversion_rate: number
              quiz_completion_rate: number
              quiz_started: number
              reached_contact_form: number
              session_to_quiz_rate: number
              submitted_contact_form: number
              total_sessions: number
              vsl_views: number
            }[]
          }
        | {
            Args: { interval_days: number; offset_days?: number }
            Returns: {
              form_submission_rate: number
              overall_conversion_rate: number
              quiz_completion_rate: number
              quiz_started: number
              reached_contact_form: number
              session_to_quiz_rate: number
              submitted_contact_form: number
              total_sessions: number
              vsl_views: number
            }[]
          }
      get_utm_performance_filtered: {
        Args: { interval_days: number }
        Returns: {
          conversion_rate: number
          conversions: number
          sessions: number
          utm_campaign: string
          utm_medium: string
          utm_source: string
        }[]
      }
      get_vsl_performance_filtered:
        | {
            Args: { interval_days: number }
            Returns: {
              avg_duration_seconds: number
              avg_percentage_watched: number
              engaged_viewers: number
              engagement_rate: number
              quiz_completed: number
              quiz_started: number
              total_vsl_views: number
              vsl_to_conversion_rate: number
              vsl_to_quiz_rate: number
            }[]
          }
        | {
            Args: { interval_days: number; offset_days?: number }
            Returns: {
              avg_duration_seconds: number
              avg_percentage_watched: number
              engaged_viewers: number
              engagement_rate: number
              quiz_completed: number
              quiz_started: number
              total_vsl_views: number
              vsl_to_conversion_rate: number
              vsl_to_quiz_rate: number
            }[]
          }
      get_vsl_watch_brackets_filtered: {
        Args: { interval_days: number }
        Returns: {
          completed_quiz: number
          conversion_rate: number
          viewers: number
          watch_bracket: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
