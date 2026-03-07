export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          media_type: Database['public']['Enums']['media_type_enum'];
          tmdb_id: number;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          media_type: Database['public']['Enums']['media_type_enum'];
          tmdb_id: number;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          media_type?: Database['public']['Enums']['media_type_enum'];
          tmdb_id?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_suggestions: {
        Row: {
          created_at: string;
          id: string;
          reason: string | null;
          source_tmdb_id: number;
          source_type: Database['public']['Enums']['media_type_enum'];
          suggested_by: string;
          target_tmdb_id: number;
          target_type: Database['public']['Enums']['media_type_enum'];
          vote_count: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          source_tmdb_id: number;
          source_type: Database['public']['Enums']['media_type_enum'];
          suggested_by: string;
          target_tmdb_id: number;
          target_type: Database['public']['Enums']['media_type_enum'];
          vote_count?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          source_tmdb_id?: number;
          source_type?: Database['public']['Enums']['media_type_enum'];
          suggested_by?: string;
          target_tmdb_id?: number;
          target_type?: Database['public']['Enums']['media_type_enum'];
          vote_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'community_suggestions_suggested_by_fkey';
            columns: ['suggested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      media_cache: {
        Row: {
          cache_key: string;
          created_at: string;
          data: Json;
          expires_at: string;
          id: string;
        };
        Insert: {
          cache_key: string;
          created_at?: string;
          data: Json;
          expires_at: string;
          id?: string;
        };
        Update: {
          cache_key?: string;
          created_at?: string;
          data?: Json;
          expires_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          reputation: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          reputation?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          reputation?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      review_votes: {
        Row: {
          created_at: string;
          id: string;
          review_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          review_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          review_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_votes_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          body: string | null;
          created_at: string;
          helpful_count: number;
          id: string;
          media_type: Database['public']['Enums']['media_type_enum'];
          rating: number;
          title: string | null;
          tmdb_id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          helpful_count?: number;
          id?: string;
          media_type: Database['public']['Enums']['media_type_enum'];
          rating: number;
          title?: string | null;
          tmdb_id: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          helpful_count?: number;
          id?: string;
          media_type?: Database['public']['Enums']['media_type_enum'];
          rating?: number;
          title?: string | null;
          tmdb_id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      suggestion_votes: {
        Row: {
          created_at: string;
          id: string;
          suggestion_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          suggestion_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          suggestion_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'suggestion_votes_suggestion_id_fkey';
            columns: ['suggestion_id'];
            isOneToOne: false;
            referencedRelation: 'community_suggestions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'suggestion_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_lists: {
        Row: {
          created_at: string;
          id: string;
          list_type: Database['public']['Enums']['list_type_enum'];
          media_type: Database['public']['Enums']['media_type_enum'];
          tmdb_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          list_type: Database['public']['Enums']['list_type_enum'];
          media_type: Database['public']['Enums']['media_type_enum'];
          tmdb_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          list_type?: Database['public']['Enums']['list_type_enum'];
          media_type?: Database['public']['Enums']['media_type_enum'];
          tmdb_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_lists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      list_type_enum: 'watchlist' | 'watched' | 'favorite';
      media_type_enum: 'movie' | 'tv';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      list_type_enum: ['watchlist', 'watched', 'favorite'],
      media_type_enum: ['movie', 'tv'],
    },
  },
} as const;
