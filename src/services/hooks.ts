
import { useState, useEffect, useCallback } from 'react';
import * as db from './dbGrading';
import { TeacherProfile, ClassData, Student, LearningObjective, School } from '../types';

export const useTeacherProfile = () => {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await db.getTeacherProfile();
      setProfile(p);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const switchSchool = async (schoolId: string) => {
    if (!profile) return;
    try {
      await db.setActiveSchool(schoolId);
      await refreshProfile();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { profile, loading, error, refreshProfile, switchSchool };
};

export const useClasses = (schoolId?: string | null) => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshClasses = useCallback(async () => {
    const targetSchoolId = schoolId || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
    const c = await db.getClasses(targetSchoolId);
    setClasses(c);
    setLoading(false);
  }, [schoolId]);

  useEffect(() => {
    refreshClasses();
  }, [refreshClasses]);

  return { classes, loading, refreshClasses };
};

export const useStudents = (idKelas?: string, schoolId?: string | null) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStudents = useCallback(async () => {
    const s = await db.getStudents(idKelas, schoolId || undefined);
    setStudents(s);
    setLoading(false);
  }, [idKelas, schoolId]);

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  return { students, loading, refreshStudents };
};
