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
          referrer: string | null
          session_id: string
          step_id: string | null
          step_index: number | null
          time_spent_seconds: number | null
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
          referrer?: string | null
          session_id: string
          step_id?: string | null
          step_index?: number | null
          time_spent_seconds?: number | null
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
          referrer?: string | null
          session_id?: string
          step_id?: string | null
          step_index?: number | null
          time_spent_seconds?: number | null
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
          referrer: string | null
          session_id: string
          user_interacted: boolean | null
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
          referrer?: string | null
          session_id: string
          user_interacted?: boolean | null
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
          referrer?: string | null
          session_id?: string
          user_interacted?: boolean | null
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
