export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Emoji: {
        Row: {
          add_user_id: string
          created_at: string
          emoji_id: string
          emoji_name: string
          updated_at: string
          usage_num: number
        }
        Insert: {
          add_user_id?: string
          created_at?: string
          emoji_id: string
          emoji_name: string
          updated_at?: string
          usage_num?: number
        }
        Update: {
          add_user_id?: string
          created_at?: string
          emoji_id?: string
          emoji_name?: string
          updated_at?: string
          usage_num?: number
        }
        Relationships: []
      }
      Message: {
        Row: {
          channnel_id: string
          created_at: string
          message_id: string
          message_text: string
          message_user_id: string
          update_at: string
        }
        Insert: {
          channnel_id: string
          created_at?: string
          message_id: string
          message_text: string
          message_user_id: string
          update_at?: string
        }
        Update: {
          channnel_id?: string
          created_at?: string
          message_id?: string
          message_text?: string
          message_user_id?: string
          update_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Message_message_user_id_fkey"
            columns: ["message_user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      MonthLog: {
        Row: {
          add_emoji_num: number
          message_send_num: number
          month_total_point: number
          reaction_1st_num: number
          result_month: string
          update_at: string
          user_id: string
        }
        Insert: {
          add_emoji_num?: number
          message_send_num?: number
          month_total_point?: number
          reaction_1st_num?: number
          result_month: string
          update_at?: string
          user_id: string
        }
        Update: {
          add_emoji_num?: number
          message_send_num?: number
          month_total_point?: number
          reaction_1st_num?: number
          result_month?: string
          update_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "MonthLog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      Reaction: {
        Row: {
          created_at: string
          emoji_id: string
          message_id: string
          reaction_id: string
          reaction_user_id: string
        }
        Insert: {
          created_at?: string
          emoji_id: string
          message_id: string
          reaction_id: string
          reaction_user_id: string
        }
        Update: {
          created_at?: string
          emoji_id?: string
          message_id?: string
          reaction_id?: string
          reaction_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Reaction_emoji_id_fkey"
            columns: ["emoji_id"]
            isOneToOne: false
            referencedRelation: "Emoji"
            referencedColumns: ["emoji_id"]
          },
          {
            foreignKeyName: "Reaction_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "Message"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "Reaction_reaction_user_id_fkey"
            columns: ["reaction_user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      User: {
        Row: {
          created_at: string
          total_point: number
          updated_at: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          total_point: number
          updated_at?: string
          user_id: string
          user_name: string
        }
        Update: {
          created_at?: string
          total_point?: number
          updated_at?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
