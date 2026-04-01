export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  targetGPA?: number;
  currentCGPA?: number;
  totalCredits?: number;
}

export interface Course {
  id: string;
  courseCode?: string;
  courseName: string;
  credits: number;
  grade: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  semesterId?: string;
  userId: string;
}

export interface Deadline {
  id: string;
  title: string;
  type: 'assignment' | 'exam' | 'project' | 'quiz';
  dueDate: string;
  status: 'pending' | 'completed';
  userId: string;
}

export interface Semester {
  id: string;
  name: string;
  userId: string;
}

export const GRADE_POINTS: Record<string, number> = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D': 1.5,
  'F': 0.0,
  '': 0.0
};
