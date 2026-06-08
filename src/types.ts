export type UserRole = 'guest' | 'student' | 'moderator' | 'admin';

export interface User {
  id: string;
  full_name: string;
  email: string;
  university: string;
  academic_year: string;
  country: string;
  profile_picture?: string;
  biography: string;
  reputation_score: number;
  role: UserRole;
  created_at: string;
  badges: string[];
}

export type CaseStatus = 'open' | 'solved' | 'archived';
export type CaseDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface ClinicalCase {
  id: string;
  author_id: string;
  author_name: string;
  author_reputation: number;
  title: string;
  specialty: string;
  difficulty: CaseDifficulty;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  chief_complaint: string;
  history_present_illness: string;
  past_medical_history: string;
  medications: string;
  vital_signs: string;
  physical_exam: string;
  laboratory_results: string;
  imaging_results: string;
  discussion_question: string;
  status: CaseStatus;
  created_at: string;
  contributions_count: number;
  votes_count: number;
}

export type ContributionCategory =
  | 'differential_diagnosis'
  | 'additional_questions'
  | 'investigations'
  | 'management_plan'
  | 'learning_points';

export interface Contribution {
  id: string;
  case_id: string;
  user_id: string;
  user_name: string;
  user_reputation: number;
  user_role: UserRole;
  category: ContributionCategory;
  content: string;
  votes: number; // calculated as upvotes - downvotes
  created_at: string;
  is_helpful?: boolean;
  moderator_recognized?: boolean;
}

export interface Vote {
  id: string;
  contribution_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string; // route link
}
