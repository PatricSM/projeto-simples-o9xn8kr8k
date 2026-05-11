export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      campaign_contacts: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          contact_hash: string
          created_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          name: string | null
          opened_at: string | null
          phone: string | null
          responded_at: string | null
          sent_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          contact_hash: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          opened_at?: string | null
          phone?: string | null
          responded_at?: string | null
          sent_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          contact_hash?: string
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name?: string | null
          opened_at?: string | null
          phone?: string | null
          responded_at?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'campaign_contacts_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      campaign_questions: {
        Row: {
          active: boolean | null
          campaign_id: string
          config: Json | null
          created_at: string
          description: string | null
          id: string
          order_index: number
          question_type: Database['public']['Enums']['question_type']
          required: boolean | null
          section_id: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          campaign_id: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          question_type: Database['public']['Enums']['question_type']
          required?: boolean | null
          section_id?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          campaign_id?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          question_type?: Database['public']['Enums']['question_type']
          required?: boolean | null
          section_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaign_questions_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_questions_section_id_fkey'
            columns: ['section_id']
            isOneToOne: false
            referencedRelation: 'campaign_sections'
            referencedColumns: ['id']
          },
        ]
      }
      campaign_sections: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          banner_config: Json | null
          banner_url: string | null
          created_at: string
          created_by: string
          custom_logo_url: string | null
          description: string | null
          expires_at: string | null
          hospital_id: string
          id: string
          name: string
          primary_color: string | null
          public_title: string | null
          public_url: string | null
          qr_code_url: string | null
          status: Database['public']['Enums']['campaign_status'] | null
          thank_you_message: string | null
          type: Database['public']['Enums']['campaign_type']
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          banner_config?: Json | null
          banner_url?: string | null
          created_at?: string
          created_by: string
          custom_logo_url?: string | null
          description?: string | null
          expires_at?: string | null
          hospital_id: string
          id?: string
          name: string
          primary_color?: string | null
          public_title?: string | null
          public_url?: string | null
          qr_code_url?: string | null
          status?: Database['public']['Enums']['campaign_status'] | null
          thank_you_message?: string | null
          type: Database['public']['Enums']['campaign_type']
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          banner_config?: Json | null
          banner_url?: string | null
          created_at?: string
          created_by?: string
          custom_logo_url?: string | null
          description?: string | null
          expires_at?: string | null
          hospital_id?: string
          id?: string
          name?: string
          primary_color?: string | null
          public_title?: string | null
          public_url?: string | null
          qr_code_url?: string | null
          status?: Database['public']['Enums']['campaign_status'] | null
          thank_you_message?: string | null
          type?: Database['public']['Enums']['campaign_type']
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaigns_hospital_id_fkey'
            columns: ['hospital_id']
            isOneToOne: false
            referencedRelation: 'hospitals'
            referencedColumns: ['id']
          },
        ]
      }
      hospitals: {
        Row: {
          active: boolean | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          additional_data: Json | null
          audit_notes: string | null
          audited_score: number | null
          campaign_id: string
          contact_points: string[] | null
          created_at: string
          feedback_text: string | null
          id: string
          ip_address: unknown
          is_audited: boolean | null
          nps_score: number | null
          problems_reported: string[] | null
          respondent_email: string | null
          respondent_hash: string | null
          respondent_phone: string | null
          response_time_seconds: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          additional_data?: Json | null
          audit_notes?: string | null
          audited_score?: number | null
          campaign_id: string
          contact_points?: string[] | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          ip_address?: unknown
          is_audited?: boolean | null
          nps_score?: number | null
          problems_reported?: string[] | null
          respondent_email?: string | null
          respondent_hash?: string | null
          respondent_phone?: string | null
          response_time_seconds?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          additional_data?: Json | null
          audit_notes?: string | null
          audited_score?: number | null
          campaign_id?: string
          contact_points?: string[] | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          ip_address?: unknown
          is_audited?: boolean | null
          nps_score?: number | null
          problems_reported?: string[] | null
          respondent_email?: string | null
          respondent_hash?: string | null
          respondent_phone?: string | null
          response_time_seconds?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'nps_responses_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          hospital_id: string | null
          id: string
          last_name: string
          phone: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          hospital_id?: string | null
          id?: string
          last_name: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          hospital_id?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_hospital_id_fkey'
            columns: ['hospital_id']
            isOneToOne: false
            referencedRelation: 'hospitals'
            referencedColumns: ['id']
          },
        ]
      }
      question_responses: {
        Row: {
          created_at: string
          id: string
          nps_response_id: string
          question_id: string
          response_value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          nps_response_id: string
          question_id: string
          response_value: Json
        }
        Update: {
          created_at?: string
          id?: string
          nps_response_id?: string
          question_id?: string
          response_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'question_responses_nps_response_id_fkey'
            columns: ['nps_response_id']
            isOneToOne: false
            referencedRelation: 'nps_responses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'question_responses_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'campaign_questions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_hospital: { Args: never; Returns: string }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database['public']['Enums']['user_role']
      }
      insert_public_nps_response: {
        Args: { p_campaign_id: string; p_id: string; p_nps_score: number }
        Returns: boolean
      }
      insert_public_question_responses: {
        Args: { p_responses: Json }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      campaign_status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
      campaign_type:
        | 'public_link'
        | 'email_batch'
        | 'sms_batch'
        | 'whatsapp_batch'
        | 'integration_flow'
      question_type:
        | 'nps_scale'
        | 'text'
        | 'multiple_choice'
        | 'rating'
        | 'contact_points'
        | 'problems'
      user_role: 'admin_platform' | 'admin_hospital' | 'user_hospital' | 'viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_status: ['draft', 'active', 'paused', 'completed', 'archived'],
      campaign_type: [
        'public_link',
        'email_batch',
        'sms_batch',
        'whatsapp_batch',
        'integration_flow',
      ],
      question_type: [
        'nps_scale',
        'text',
        'multiple_choice',
        'rating',
        'contact_points',
        'problems',
      ],
      user_role: ['admin_platform', 'admin_hospital', 'user_hospital', 'viewer'],
    },
  },
} as const
