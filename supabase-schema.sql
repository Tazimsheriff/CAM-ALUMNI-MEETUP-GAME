-- SUPABASE SCHEMA FOR CODESAPIENS ALUMNI MEETUP BINGO

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    cohort_year INTEGER,
    "current_role" TEXT,
    company TEXT,
    email TEXT,
    linkedin_handle TEXT,
    github_handle TEXT,
    website_url TEXT,
    avatar_initials VARCHAR(4),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure the check constraint is updated to 2030 for existing databases
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cohort_year_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cohort_year_check CHECK (cohort_year >= 2019 AND cohort_year <= 2030);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Anyone can view profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

CREATE POLICY "Anyone can view profiles." 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);


-- 2. Create boards table
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    squares JSONB NOT NULL, -- jsonb array of 24 strings
    checked_indices JSONB NOT NULL, -- jsonb array of integers
    event_name TEXT DEFAULT 'CodeSapiens Alumni Meetup'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on boards
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Boards Policies
DROP POLICY IF EXISTS "Users can view their own board." ON public.boards;
DROP POLICY IF EXISTS "Users can update/insert their own board." ON public.boards;

CREATE POLICY "Users can view their own board." 
    ON public.boards FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update/insert their own board." 
    ON public.boards FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. Create scores table
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    points INTEGER DEFAULT 0 NOT NULL,
    bingos INTEGER DEFAULT 0 NOT NULL,
    squares_checked INTEGER DEFAULT 0 NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on scores
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Scores Policies
DROP POLICY IF EXISTS "Anyone can view scores." ON public.scores;
DROP POLICY IF EXISTS "Users can manage their own score." ON public.scores;

CREATE POLICY "Anyone can view scores." 
    ON public.scores FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own score." 
    ON public.scores FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- Enable Realtime for the scores and profiles tables safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' 
          AND c.relname = 'scores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' 
          AND c.relname = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;


-- 4. Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    connected_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, connected_user_id)
);

-- Enable RLS on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Connections Policies
DROP POLICY IF EXISTS "Anyone can view connections." ON public.connections;
DROP POLICY IF EXISTS "Users can insert their own connections." ON public.connections;

CREATE POLICY "Anyone can view connections." 
    ON public.connections FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own connections." 
    ON public.connections FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for connections safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        WHERE p.pubname = 'supabase_realtime' 
          AND c.relname = 'connections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
    END IF;
END $$;


-- Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, avatar_initials, cohort_year)
    VALUES (
        new.id,
        new.email,
        upper(substring(new.email from 1 for 2)),
        2025
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
