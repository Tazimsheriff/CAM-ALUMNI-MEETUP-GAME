export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  cohort_year: number; // 2019-2025
  current_role: string;
  company: string;
  email: string;
  linkedin_handle: string;
  github_handle: string;
  website_url: string;
  avatar_initials: string;
  created_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  squares: string[]; // Array of 24 shuffled strings (free space in center is computed or handled in UI)
  checked_indices: number[]; // Array of checked index numbers (0-24, where 12 is center/free space)
  event_name: string;
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  user_id: string;
  points: number;
  bingos: number;
  squares_checked: number;
  submitted_at: string;
  profiles?: Profile; // Joined profile data
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}
