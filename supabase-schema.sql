-- SUPABASE SCHEMA FOR CODESAPIENS ALUMNI MEETUP BINGO

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    cohort_year INTEGER CHECK (cohort_year >= 2019 AND cohort_year <= 2025),
    "current_role" TEXT,
    company TEXT,
    email TEXT,
    linkedin_handle TEXT,
    github_handle TEXT,
    website_url TEXT,
    avatar_initials VARCHAR(4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile." 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

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
CREATE POLICY "Anyone can view scores." 
    ON public.scores FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own score." 
    ON public.scores FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- Enable Realtime for the scores table
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;

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

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
