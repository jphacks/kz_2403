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
      Contract: {
        Row: {
          command_name: string
          created_at: string
          deadline_at: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          command_name: string
          created_at?: string
          deadline_at: string
          updated_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          command_name?: string
          created_at?: string
          deadline_at?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Contract_command_name_fkey"
            columns: ["command_name"]
            isOneToOne: false
            referencedRelation: "SpecialCommand"
            referencedColumns: ["command_name"]
          },
          {
            foreignKeyName: "Contract_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ContractNew: {
        Row: {
          command_name: string
          created_at: string
          deadline_at: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          command_name: string
          created_at?: string
          deadline_at: string
          updated_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          command_name?: string
          created_at?: string
          deadline_at?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ContractNew_command_name_fkey"
            columns: ["command_name"]
            isOneToOne: false
            referencedRelation: "SpecialCommandNew"
            referencedColumns: ["command_name"]
          },
          {
            foreignKeyName: "ContractNew_user_id_workspace_id_fkey"
            columns: ["user_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "UserNew"
            referencedColumns: ["user_id", "workspace_id"]
          },
          {
            foreignKeyName: "ContractNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      Emoji: {
        Row: {
          add_user_id: string | null
          created_at: string
          emoji_id: string
          emoji_name: string
          label: string | null
          updated_at: string
          usage_num: number
          workspace_id: string
        }
        Insert: {
          add_user_id?: string | null
          created_at?: string
          emoji_id: string
          emoji_name: string
          label?: string | null
          updated_at?: string
          usage_num?: number
          workspace_id?: string
        }
        Update: {
          add_user_id?: string | null
          created_at?: string
          emoji_id?: string
          emoji_name?: string
          label?: string | null
          updated_at?: string
          usage_num?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Emoji_add_user_id_fkey"
            columns: ["add_user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "Emoji_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      EmojiNew: {
        Row: {
          created_at: string
          emoji_id: string
          emoji_name: string
          label: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          emoji_id: string
          emoji_name: string
          label: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          emoji_id?: string
          emoji_name?: string
          label?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "EmojiNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
        ]
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
      MessageNew: {
        Row: {
          channel_id: string
          created_at: string
          message_id: string
          message_text: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          message_id: string
          message_text: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          message_id?: string
          message_text?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "MessageNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "MessageNew_workspace_id_user_id_fkey"
            columns: ["workspace_id", "user_id"]
            isOneToOne: false
            referencedRelation: "UserNew"
            referencedColumns: ["workspace_id", "user_id"]
          },
        ]
      }
      MonthLog: {
        Row: {
          created_at: string
          month_total_point: number
          month_year: number
          result_month: string
          update_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          month_total_point?: number
          month_year?: number
          result_month: string
          update_at?: string
          user_id: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          month_total_point?: number
          month_year?: number
          result_month?: string
          update_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "MonthLog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "MonthLog_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      MonthLogNew: {
        Row: {
          created_at: string
          month_total_point: number
          month_year: number
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          month_total_point?: number
          month_year?: number
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          month_total_point?: number
          month_year?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "MonthLogNew_user_id_workspace_id_fkey"
            columns: ["user_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "UserNew"
            referencedColumns: ["user_id", "workspace_id"]
          },
          {
            foreignKeyName: "MonthLogNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
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
          workspace_id: string
        }
        Insert: {
          created_at?: string
          emoji_id: string
          message_id: string
          reaction_id: string
          reaction_user_id: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          emoji_id?: string
          message_id?: string
          reaction_id?: string
          reaction_user_id?: string
          workspace_id?: string
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
          {
            foreignKeyName: "Reaction_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      ReactionNew: {
        Row: {
          created_at: string
          emoji_id: string
          message_id: string
          reaction_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          emoji_id: string
          message_id: string
          reaction_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          emoji_id?: string
          message_id?: string
          reaction_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ReactionNew_emoji_id_fkey"
            columns: ["emoji_id"]
            isOneToOne: false
            referencedRelation: "EmojiNew"
            referencedColumns: ["emoji_id"]
          },
          {
            foreignKeyName: "ReactionNew_message_id_workspace_id_fkey"
            columns: ["message_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "MessageNew"
            referencedColumns: ["message_id", "workspace_id"]
          },
          {
            foreignKeyName: "ReactionNew_user_id_workspace_id_fkey"
            columns: ["user_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "UserNew"
            referencedColumns: ["user_id", "workspace_id"]
          },
          {
            foreignKeyName: "ReactionNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      Remind: {
        Row: {
          created_at: string
          remind_id: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          remind_id?: number
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          remind_id?: number
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Remind_user_id_workspace_id_fkey"
            columns: ["user_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "UserNew"
            referencedColumns: ["user_id", "workspace_id"]
          },
          {
            foreignKeyName: "Remind_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      SpecialCommand: {
        Row: {
          command_name: string
          cost: number
          created_at: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          command_name: string
          cost?: number
          created_at?: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          command_name?: string
          cost?: number
          created_at?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "SpecialCommand_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      SpecialCommandNew: {
        Row: {
          command_name: string
          cost: number
          created_at: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          command_name: string
          cost?: number
          created_at?: string
          updated_at?: string
          workspace_id?: string
        }
        Update: {
          command_name?: string
          cost?: number
          created_at?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "SpecialCommandNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      User: {
        Row: {
          created_at: string
          earned_point: number
          total_point: number
          updated_at: string
          user_id: string
          user_name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          earned_point?: number
          total_point?: number
          updated_at?: string
          user_id: string
          user_name: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          earned_point?: number
          total_point?: number
          updated_at?: string
          user_id?: string
          user_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_workdspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      UserNew: {
        Row: {
          add_point: number
          created_at: string
          total_point: number
          updated_at: string
          user_id: string
          user_name: string
          workspace_id: string
        }
        Insert: {
          add_point?: number
          created_at?: string
          total_point?: number
          updated_at?: string
          user_id: string
          user_name: string
          workspace_id?: string
        }
        Update: {
          add_point?: number
          created_at?: string
          total_point?: number
          updated_at?: string
          user_id?: string
          user_name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserNew_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "WorkspaceNew"
            referencedColumns: ["workspace_id"]
          },
        ]
      }
      Workspace: {
        Row: {
          created_at: string
          slack_bot_token: string | null
          slack_singing_token: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          slack_bot_token?: string | null
          slack_singing_token?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          slack_bot_token?: string | null
          slack_singing_token?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      WorkspaceNew: {
        Row: {
          created_at: string
          slack_bot_token: string | null
          slack_singing_token: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          slack_bot_token?: string | null
          slack_singing_token?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          slack_bot_token?: string | null
          slack_singing_token?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_total_points:
        | {
            Args: {
              increment: number
              user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              v_user_id: string
              increment: number
            }
            Returns: undefined
          }
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
