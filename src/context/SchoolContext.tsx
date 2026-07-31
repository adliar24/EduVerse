import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface School {
  id: string;
  name: string;
  address?: string;
}

interface SchoolContextType {
  schools: School[];
  activeSchool: School | null;
  setActiveSchool: (school: School | null) => Promise<void>;
  loading: boolean;
  isSchoolInitialized: boolean;
  refreshSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchoolState] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSchoolInitialized, setIsSchoolInitialized] = useState(false);

  const CANONICAL_SCHOOL: School = {
    id: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7',
    name: 'SMAN 19 Bandung',
    address: 'Jl. Dago Spesial No. 1, Bandung'
  };

  const refreshSchools = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSchools([CANONICAL_SCHOOL]);
        setActiveSchoolState(CANONICAL_SCHOOL);
        localStorage.setItem('active_school_id', CANONICAL_SCHOOL.id);
        setLoading(false);
        return;
      }

      const { data: teacherSchools } = await supabase
        .from('teacher_schools')
        .select('school_id, schools(id, name, address)')
        .eq('teacher_id', session.user.id);

      let schoolList: School[] = [CANONICAL_SCHOOL];

      if (teacherSchools && teacherSchools.length > 0) {
        const fetchedList = teacherSchools
          .map((ts): School | null => {
            const raw = (ts as any).schools || (ts as any).school;
            const s = Array.isArray(raw) ? raw[0] : raw;
            const schoolId = s?.id || ts.school_id;
            if (!schoolId) return null;
            return {
              id: schoolId,
              name: s?.name || s?.nama || 'Sekolah',
              address: s?.address || s?.alamat || undefined
            };
          })
          .filter((s): s is School => s !== null);

        schoolList = [...fetchedList, CANONICAL_SCHOOL];
      } else {
        const { data: allSchools } = await supabase.from('schools').select('*');
        if (allSchools && allSchools.length > 0) {
          const fetchedAll = allSchools.map((s: any) => ({
            id: s.id,
            name: s.name || s.nama || 'Sekolah',
            address: s.address || s.alamat || ''
          }));
          schoolList = [...fetchedAll, CANONICAL_SCHOOL];
        }
      }

      const uniqueByNameMap = new Map<string, School>();
      for (const s of schoolList) {
        const key = s.name.toLowerCase().trim();
        if (!uniqueByNameMap.has(key) || s.id === CANONICAL_SCHOOL.id) {
          uniqueByNameMap.set(key, s);
        }
      }

      const finalSchools = Array.from(uniqueByNameMap.values());
      const active = finalSchools.find(s => s.id === CANONICAL_SCHOOL.id) || finalSchools[0] || CANONICAL_SCHOOL;

      setSchools(finalSchools);
      setActiveSchoolState(active);
      localStorage.setItem('active_school_id', active.id);
    } catch (error) {
      console.error('Error loading schools:', error);
      setSchools([CANONICAL_SCHOOL]);
      setActiveSchoolState(CANONICAL_SCHOOL);
      localStorage.setItem('active_school_id', CANONICAL_SCHOOL.id);
    } finally {
      setLoading(false);
      setIsSchoolInitialized(true);
    }
  };

  useEffect(() => {
    refreshSchools();

    window.addEventListener('auth_state_change', refreshSchools);
    window.addEventListener('storage', refreshSchools);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshSchools();
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth_state_change', refreshSchools);
      window.removeEventListener('storage', refreshSchools);
    };
  }, []);

  const setActiveSchool = async (school: School | null) => {
    setActiveSchoolState(school);
    if (school) {
      localStorage.setItem('active_school_id', school.id);
    } else {
      localStorage.removeItem('active_school_id');
    }
  };

  return (
    <SchoolContext.Provider value={{ schools, activeSchool, setActiveSchool, loading, isSchoolInitialized, refreshSchools }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
