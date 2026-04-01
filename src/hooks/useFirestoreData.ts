import React, { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, OperationType, handleFirestoreError } from '../firebase';
import { Course, Deadline, Semester } from '../types';

export function useFirestoreData(userId: string | undefined) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCourses([]);
      setDeadlines([]);
      setSemesters([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const coursesQuery = collection(db, 'users', userId, 'courses');
    const deadlinesQuery = collection(db, 'users', userId, 'deadlines');
    const semestersQuery = collection(db, 'users', userId, 'semesters');

    const unsubCourses = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/courses`));

    const unsubDeadlines = onSnapshot(deadlinesQuery, (snapshot) => {
      setDeadlines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deadline)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/deadlines`));

    const unsubSemesters = onSnapshot(semestersQuery, (snapshot) => {
      setSemesters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Semester)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${userId}/semesters`));

    setLoading(false);

    return () => {
      unsubCourses();
      unsubDeadlines();
      unsubSemesters();
    };
  }, [userId]);

  const addCourse = async (course: Omit<Course, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'courses'), course);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/courses`);
    }
  };

  const updateCourse = async (id: string, course: Partial<Course>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'courses', id), course);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/courses/${id}`);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'courses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/courses/${id}`);
    }
  };

  const addDeadline = async (deadline: Omit<Deadline, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'deadlines'), deadline);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/deadlines`);
    }
  };

  const updateDeadline = async (id: string, deadline: Partial<Deadline>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'deadlines', id), deadline);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/deadlines/${id}`);
    }
  };

  const deleteDeadline = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'deadlines', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/deadlines/${id}`);
    }
  };

  const addSemester = async (semester: Omit<Semester, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'semesters'), semester);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/semesters`);
    }
  };

  return { 
    courses, deadlines, semesters, loading, 
    addCourse, updateCourse, deleteCourse,
    addDeadline, updateDeadline, deleteDeadline,
    addSemester
  };
}
