-- ====================================================================
-- HOUSIE NIGHT (TAMBOLA) PRODUCTION SUPABASE SCHEMA & REALTIME
-- ====================================================================

-- Enable pgcrypto for UUIDs and random generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    host_player_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, in_progress, paused, completed
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_players INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms(is_active);

-- 2. PLAYERS TABLE (Anonymous Sessions)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    display_name VARCHAR(30) NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_player_name UNIQUE (room_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_players_room ON public.players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_token ON public.players(session_token);

-- Foreign key link back from room host to player
ALTER TABLE public.rooms 
    DROP CONSTRAINT IF EXISTS fk_rooms_host,
    ADD CONSTRAINT fk_rooms_host FOREIGN KEY (host_player_id) REFERENCES public.players(id) ON DELETE SET NULL;

-- 3. GAME ROUNDS TABLE
CREATE TABLE IF NOT EXISTS public.game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, in_progress, paused, completed
    called_numbers INT[] NOT NULL DEFAULT '{}',
    remaining_numbers INT[] NOT NULL DEFAULT '{}',
    enabled_categories TEXT[] NOT NULL DEFAULT ARRAY['early_five', 'top_line', 'middle_line', 'bottom_line', 'four_corners', 'full_house'],
    auto_call BOOLEAN NOT NULL DEFAULT FALSE,
    auto_call_interval INT NOT NULL DEFAULT 5,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_round UNIQUE (room_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_game_rounds_room ON public.game_rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_status ON public.game_rounds(status);

-- 4. TICKETS TABLE (Authentic 3x9 Tambola Tickets)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    numbers JSONB NOT NULL, -- 3x9 array of numbers (15 numbers total, 0 for blank)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_player_round_ticket UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_round ON public.tickets(round_id);
CREATE INDEX IF NOT EXISTS idx_tickets_player ON public.tickets(player_id);

-- 5. WINNING CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.winning_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.game_rounds(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL, -- early_five, top_line, middle_line, bottom_line, four_corners, full_house
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    called_number_index INT NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_round_category_claim UNIQUE (round_id, category)
);

CREATE INDEX IF NOT EXISTS idx_winning_claims_round ON public.winning_claims(round_id);
CREATE INDEX IF NOT EXISTS idx_winning_claims_player ON public.winning_claims(player_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_claims ENABLE ROW LEVEL SECURITY;

-- Rooms: Public can select active rooms
DROP POLICY IF EXISTS "Public can view active rooms" ON public.rooms;
CREATE POLICY "Public can view active rooms" ON public.rooms
    FOR SELECT USING (is_active = TRUE AND expires_at > NOW());

-- Players: Public can view players in active rooms (for lobby / participant list)
DROP POLICY IF EXISTS "Public can view players in active room" ON public.players;
CREATE POLICY "Public can view players in active room" ON public.players
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = room_id AND r.is_active = TRUE
        )
    );

-- Game Rounds: Public can view active game rounds (excluding secret remaining_numbers pool)
DROP POLICY IF EXISTS "Public can view game rounds" ON public.game_rounds;
CREATE POLICY "Public can view game rounds" ON public.game_rounds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = room_id AND r.is_active = TRUE
        )
    );

-- Tickets: Public can view tickets in rounds
DROP POLICY IF EXISTS "Public can view tickets" ON public.tickets;
CREATE POLICY "Public can view tickets" ON public.tickets
    FOR SELECT USING (TRUE);

-- Winning Claims: Public can view confirmed winning claims
DROP POLICY IF EXISTS "Public can view winning claims" ON public.winning_claims;
CREATE POLICY "Public can view winning claims" ON public.winning_claims
    FOR SELECT USING (TRUE);

-- ====================================================================
-- ATOMIC SECURITY DEFINER FUNCTIONS (AUTHORITATIVE ENGINE)
-- ====================================================================

-- 1. Atomic Number Caller Function
CREATE OR REPLACE FUNCTION public.rpc_call_next_number(
    p_room_code TEXT,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room RECORD;
    v_player RECORD;
    v_round RECORD;
    v_called_num INT;
    v_new_remaining INT[];
    v_new_called INT[];
    v_is_last BOOLEAN := FALSE;
BEGIN
    -- Verify room
    SELECT * INTO v_room FROM public.rooms WHERE room_code = UPPER(p_room_code) AND is_active = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Room not found or expired');
    END IF;

    -- Verify caller is host
    SELECT * INTO v_player FROM public.players WHERE session_token = p_session_token AND room_id = v_room.id;
    IF NOT FOUND OR v_player.id != v_room.host_player_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only the authorized host can call numbers');
    END IF;

    -- Get active round with row lock
    SELECT * INTO v_round FROM public.game_rounds 
    WHERE room_id = v_room.id AND status = 'in_progress' 
    ORDER BY round_number DESC LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No round currently in progress');
    END IF;

    -- Check if remaining numbers pool is empty
    IF array_length(v_round.remaining_numbers, 1) IS NULL OR array_length(v_round.remaining_numbers, 1) = 0 THEN
        UPDATE public.game_rounds SET status = 'completed', completed_at = NOW() WHERE id = v_round.id;
        RETURN jsonb_build_object('success', false, 'message', 'All 90 numbers have been called', 'completed', true);
    END IF;

    -- Pop the last element atomically
    v_called_num := v_round.remaining_numbers[array_length(v_round.remaining_numbers, 1)];
    v_new_remaining := v_round.remaining_numbers[1:array_length(v_round.remaining_numbers, 1) - 1];
    v_new_called := array_append(v_round.called_numbers, v_called_num);

    IF array_length(v_new_remaining, 1) = 0 OR array_length(v_new_remaining, 1) IS NULL THEN
        v_is_last := TRUE;
    END IF;

    -- Update round in database
    UPDATE public.game_rounds
    SET called_numbers = v_new_called,
        remaining_numbers = v_new_remaining,
        status = CASE WHEN v_is_last THEN 'completed' ELSE 'in_progress' END,
        completed_at = CASE WHEN v_is_last THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = v_round.id;

    RETURN jsonb_build_object(
        'success', true,
        'number', v_called_num,
        'totalCalled', array_length(v_new_called, 1),
        'remainingCount', COALESCE(array_length(v_new_remaining, 1), 0),
        'isCompleted', v_is_last
    );
END;
$$;

-- 2. Atomic Winning Claim Verification & Recording
CREATE OR REPLACE FUNCTION public.rpc_record_winning_claim(
    p_round_id UUID,
    p_player_id UUID,
    p_category TEXT,
    p_call_index INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing RECORD;
    v_player RECORD;
    v_claim_id UUID;
BEGIN
    -- Check if already claimed (first valid claim wins)
    SELECT * INTO v_existing FROM public.winning_claims WHERE round_id = p_round_id AND category = p_category;
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'This category has already been won by another player');
    END IF;

    SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Player not found');
    END IF;

    -- Insert claim atomically
    INSERT INTO public.winning_claims (round_id, category, player_id, called_number_index, is_valid)
    VALUES (p_round_id, p_category, p_player_id, p_call_index, TRUE)
    RETURNING id INTO v_claim_id;

    RETURN jsonb_build_object(
        'success', true,
        'claimId', v_claim_id,
        'category', p_category,
        'playerId', p_player_id,
        'playerName', v_player.display_name,
        'calledNumberIndex', p_call_index,
        'claimedAt', NOW()
    );
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'message', 'This category was just claimed by another player');
END;
$$;

-- ====================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ====================================================================

-- Add tables to supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'players'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_rounds'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rounds;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'winning_claims'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.winning_claims;
    END IF;
END $$;
