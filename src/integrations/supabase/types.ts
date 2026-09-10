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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analysis_runs: {
        Row: {
          details: Json
          error: string | null
          finished_at: string | null
          id: string
          progress: number
          report_id: string | null
          stage: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          details?: Json
          error?: string | null
          finished_at?: string | null
          id?: string
          progress?: number
          report_id?: string | null
          stage?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          details?: Json
          error?: string | null
          finished_at?: string | null
          id?: string
          progress?: number
          report_id?: string | null
          stage?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          report_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          report_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          report_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          confidence: number | null
          content: string
          conversation_id: string | null
          created_at: string | null
          evidence: Json | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          response: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          page_number: number | null
          report_id: string | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          report_id?: string | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      document_pages: {
        Row: {
          char_count: number
          created_at: string
          id: string
          page_number: number
          report_id: string
          source: string
          text: string
          user_id: string
        }
        Insert: {
          char_count?: number
          created_at?: string
          id?: string
          page_number: number
          report_id: string
          source?: string
          text: string
          user_id: string
        }
        Update: {
          char_count?: number
          created_at?: string
          id?: string
          page_number?: number
          report_id?: string
          source?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_pages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_scores: {
        Row: {
          confidence: string | null
          created_at: string
          data_coverage: number | null
          disclosure_score: number | null
          evidence: Json
          id: string
          indicators_used: Json
          negative_factors: Json
          performance_score: number | null
          pillar: string
          positive_factors: Json
          report_id: string
          score: number | null
          user_id: string
          weights: Json
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          data_coverage?: number | null
          disclosure_score?: number | null
          evidence?: Json
          id?: string
          indicators_used?: Json
          negative_factors?: Json
          performance_score?: number | null
          pillar: string
          positive_factors?: Json
          report_id: string
          score?: number | null
          user_id: string
          weights?: Json
        }
        Update: {
          confidence?: string | null
          created_at?: string
          data_coverage?: number | null
          disclosure_score?: number | null
          evidence?: Json
          id?: string
          indicators_used?: Json
          negative_factors?: Json
          performance_score?: number | null
          pillar?: string
          positive_factors?: Json
          report_id?: string
          score?: number | null
          user_id?: string
          weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "esg_scores_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          category: string | null
          claim: string
          confidence: number
          created_at: string
          id: string
          metric_key: string | null
          page: number | null
          report_id: string
          snippet: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          claim: string
          confidence?: number
          created_at?: string
          id?: string
          metric_key?: string | null
          page?: number | null
          report_id: string
          snippet?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          claim?: string
          confidence?: number
          created_at?: string
          id?: string
          metric_key?: string | null
          page?: number | null
          report_id?: string
          snippet?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_metrics: {
        Row: {
          category: string
          confidence: number
          created_at: string
          evidence: string | null
          id: string
          metric_key: string
          metric_name: string
          page: number | null
          report_id: string
          status: string
          unit: string | null
          user_id: string
          value: number | null
          value_text: string | null
          year: number | null
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          evidence?: string | null
          id?: string
          metric_key: string
          metric_name: string
          page?: number | null
          report_id: string
          status?: string
          unit?: string | null
          user_id: string
          value?: number | null
          value_text?: string | null
          year?: number | null
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          evidence?: string | null
          id?: string
          metric_key?: string
          metric_name?: string
          page?: number | null
          report_id?: string
          status?: string
          unit?: string | null
          user_id?: string
          value?: number | null
          value_text?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extracted_metrics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_documents: {
        Row: {
          created_at: string
          extraction_method: string | null
          file_name: string
          id: string
          mime_type: string | null
          page_count: number | null
          report_id: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extraction_method?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          report_id: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          extraction_method?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          report_id?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_documents_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          analysis_data: Json | null
          company_name: string | null
          confidence_level: string | null
          created_at: string | null
          document_type: string | null
          evidence: Json | null
          extracted_metrics: Json | null
          file_name: string | null
          file_url: string | null
          hash: string | null
          id: string
          metadata: Json
          page_count: number | null
          quality: Json
          report_year: number | null
          score: number | null
          status: string
          storage_path: string | null
          updated_at: string | null
          user_id: string | null
          validation: Json
          validation_status: string | null
        }
        Insert: {
          analysis_data?: Json | null
          company_name?: string | null
          confidence_level?: string | null
          created_at?: string | null
          document_type?: string | null
          evidence?: Json | null
          extracted_metrics?: Json | null
          file_name?: string | null
          file_url?: string | null
          hash?: string | null
          id?: string
          metadata?: Json
          page_count?: number | null
          quality?: Json
          report_year?: number | null
          score?: number | null
          status?: string
          storage_path?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation?: Json
          validation_status?: string | null
        }
        Update: {
          analysis_data?: Json | null
          company_name?: string | null
          confidence_level?: string | null
          created_at?: string | null
          document_type?: string | null
          evidence?: Json | null
          extracted_metrics?: Json | null
          file_name?: string | null
          file_url?: string | null
          hash?: string | null
          id?: string
          metadata?: Json
          page_count?: number | null
          quality?: Json
          report_year?: number | null
          score?: number | null
          status?: string
          storage_path?: string | null
          updated_at?: string | null
          user_id?: string | null
          validation?: Json
          validation_status?: string | null
        }
        Relationships: []
      }
      risk_factors: {
        Row: {
          category: string
          confidence: number
          created_at: string
          description: string | null
          evidence: string | null
          id: string
          kind: string
          page: number | null
          report_id: string
          severity: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          description?: string | null
          evidence?: string | null
          id?: string
          kind?: string
          page?: number | null
          report_id: string
          severity?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          description?: string | null
          evidence?: string | null
          id?: string
          kind?: string
          page?: number | null
          report_id?: string
          severity?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_factors_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      match_document_embeddings: {
        Args: {
          p_match_count?: number
          p_query_embedding: string
          p_report_id: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          id: string
          page_number: number
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "analyst", "viewer"],
    },
  },
} as const
