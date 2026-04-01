import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateGPA(courses: { credits: number; grade: string }[]) {
  const gradedCourses = courses.filter(c => c.grade && c.grade !== '');
  if (gradedCourses.length === 0) return 0;

  const GRADE_POINTS: Record<string, number> = {
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'D': 1.5,
    'F': 0.0
  };

  let totalPoints = 0;
  let totalCredits = 0;

  gradedCourses.forEach(course => {
    const points = GRADE_POINTS[course.grade] || 0;
    totalPoints += points * course.credits;
    totalCredits += course.credits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}
