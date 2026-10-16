export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          room_code: string;
          name: string;
          host_player_id: string | null;
          status: 'waiting' | 'in_progress' | 'paused' | 'completed';
          is_active: boolean;
          max_players: number;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          room_code: string;
          name: string;
          host_player_id?: string | null;
          status?: 'waiting' | 'in_progress' | 'paused' | 'completed';
          is_active?: boolean;
          max_players?: number;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          room_code?: string;
          name?: string;
          host_player_id?: string | null;
          status?: 'waiting' | 'in_progress' | 'paused' | 'completed';
          is_active?: boolean;
          max_players?: number;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          display_name: string;
          session_token: string;
          is_host: boolean;
          is_connected: boolean;
          joined_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          display_name: string;
          session_token: string;
          is_host?: boolean;
          is_connected?: boolean;
          joined_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          display_name?: string;
          session_token?: string;
          is_host?: boolean;
          is_connected?: boolean;
          joined_at?: string;
          last_seen_at?: string;
        };
      };
      game_rounds: {
        Row: {
          id: string;
          room_id: string;
          round_number: number;
          status: 'waiting' | 'in_progress' | 'paused' | 'completed';
          called_numbers: number[];
          remaining_numbers: number[];
          enabled_categories: string[];
          auto_call: boolean;
          auto_call_interval: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_number?: number;
          status?: 'waiting' | 'in_progress' | 'paused' | 'completed';
          called_numbers?: number[];
          remaining_numbers?: number[];
          enabled_categories?: string[];
          auto_call?: boolean;
          auto_call_interval?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          round_number?: number;
          status?: 'waiting' | 'in_progress' | 'paused' | 'completed';
          called_numbers?: number[];
          remaining_numbers?: number[];
          enabled_categories?: string[];
          auto_call?: boolean;
          auto_call_interval?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          round_id: string;
          player_id: string;
          numbers: number[][];
          created_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          player_id: string;
          numbers: number[][];
          created_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          player_id?: string;
          numbers?: number[][];
          created_at?: string;
        };
      };
      winning_claims: {
        Row: {
          id: string;
          round_id: string;
          category: string;
          player_id: string;
          called_number_index: number;
          is_valid: boolean;
          claimed_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          category: string;
          player_id: string;
          called_number_index: number;
          is_valid?: boolean;
          claimed_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          category?: string;
          player_id?: string;
          called_number_index?: number;
          is_valid?: boolean;
          claimed_at?: string;
        };
      };
    };
    Functions: {
      rpc_call_next_number: {
        Args: {
          p_room_code: string;
          p_session_token: string;
        };
        Returns: {
          success: boolean;
          number?: number;
          totalCalled?: number;
          remainingCount?: number;
          isCompleted?: boolean;
          message?: string;
        };
      };
      rpc_record_winning_claim: {
        Args: {
          p_round_id: string;
          p_player_id: string;
          p_category: string;
          p_call_index: number;
        };
        Returns: {
          success: boolean;
          claimId?: string;
          category?: string;
          playerId?: string;
          playerName?: string;
          calledNumberIndex?: number;
          claimedAt?: string;
          message?: string;
        };
      };
    };
  };
}
