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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          calories: number | null
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          ingredients_ar: string[] | null
          is_available: boolean | null
          is_gluten_free: boolean | null
          is_spicy: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          name_ar: string
          price: number
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          calories?: number | null
          category: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          ingredients_ar?: string[] | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_spicy?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          name_ar: string
          price: number
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          calories?: number | null
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          ingredients_ar?: string[] | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_spicy?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          name_ar?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          modifiers: string[] | null
          name: string
          name_ar: string | null
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          modifiers?: string[] | null
          name: string
          name_ar?: string | null
          order_id: string
          price: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          modifiers?: string[] | null
          name?: string
          name_ar?: string | null
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_via: string | null
          customer_user_id: string | null
          deposit_applied: number | null
          id: string
          order_number: string
          payment_status: string | null
          reservation_id: string | null
          status: string
          subtotal: number
          table_number: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_via?: string | null
          customer_user_id?: string | null
          deposit_applied?: number | null
          id?: string
          order_number: string
          payment_status?: string | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          table_number: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_via?: string | null
          customer_user_id?: string | null
          deposit_applied?: number | null
          id?: string
          order_number?: string
          payment_status?: string | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          table_number?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservation_private_details: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          reservation_id: string
          special_requests: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone: string
          reservation_id: string
          special_requests?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          reservation_id?: string
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_reservation"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          customer_user_id: string | null
          deposit_amount: number | null
          deposit_status: string | null
          guests: number
          id: string
          qr_code: string | null
          qr_expires_at: string | null
          qr_used_at: string | null
          reservation_code: string | null
          reservation_date: string
          reservation_number: string
          reservation_time: string
          status: string
          table_id: string | null
          updated_at: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          customer_user_id?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          guests?: number
          id?: string
          qr_code?: string | null
          qr_expires_at?: string | null
          qr_used_at?: string | null
          reservation_code?: string | null
          reservation_date: string
          reservation_number: string
          reservation_time: string
          status?: string
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          customer_user_id?: string | null
          deposit_amount?: number | null
          deposit_status?: string | null
          guests?: number
          id?: string
          qr_code?: string | null
          qr_expires_at?: string | null
          qr_used_at?: string | null
          reservation_code?: string | null
          reservation_date?: string
          reservation_number?: string
          reservation_time?: string
          status?: string
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          position_x: number | null
          position_y: number | null
          table_number: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          position_x?: number | null
          position_y?: number | null
          table_number: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          position_x?: number | null
          position_y?: number | null
          table_number?: number
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_secure: {
        Args: {
          p_items?: Json
          p_reservation_id?: string
          p_table_number: number
        }
        Returns: Json
      }
      create_reservation_secure: {
        Args: {
          p_email: string
          p_full_name: string
          p_guests: number
          p_phone: string
          p_reservation_date: string
          p_reservation_time: string
          p_special_requests?: string
        }
        Returns: Json
      }
      generate_order_number: { Args: never; Returns: string }
      generate_reservation_number: { Args: never; Returns: string }
      get_available_tables: {
        Args: { p_date: string; p_guests: number; p_time: string }
        Returns: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean | null
          location: string | null
          position_x: number | null
          position_y: number | null
          table_number: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tables"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_current_user_email: { Args: never; Returns: string }
      get_reservation_with_details: {
        Args: { p_reservation_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
        }
        Returns: string
      }
      log_payment: {
        Args: {
          p_amount: number
          p_method?: string
          p_order_id: string
          p_status: string
        }
        Returns: Json
      }
      validate_and_use_qr: {
        Args: { p_qr_code: string; p_reservation_number?: string }
        Returns: Json
      }
      validate_reservation_input: {
        Args: {
          p_date: string
          p_email: string
          p_full_name: string
          p_guests: number
          p_phone: string
          p_time: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "manager"
      order_creation_method: "reservation" | "walk_in" | "qr_table"
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
      app_role: ["admin", "staff", "manager"],
      order_creation_method: ["reservation", "walk_in", "qr_table"],
    },
  },
} as const
