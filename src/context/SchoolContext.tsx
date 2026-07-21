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
  refreshSchools: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchoolState] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSchools = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSchools([]);
        setActiveSchoolState(null);
        setLoading(false);
        return;
      }

      console.log('SchoolContext - User ID:', session.user.id);
      
      const { data: teacherSchools, error: teacherSchoolsError } = await supabase
        .from('teacher_schools')
        .select('school_id, schools(id, name, address)')
        .eq('teacher_id', session.user.id);

      console.log('SchoolContext - teacherSchools:', teacherSchools);

      if (teacherSchoolsError) {
        console.error('Error fetching teacher schools:', teacherSchoolsError);
        setLoading(false);
        return;
      }

      if (teacherSchools && teacherSchools.length > 0) {
        const schoolList = teacherSchools
          .map(ts => {
            // Support both direct object and array returns from Supabase joins
            const s = (ts as any).schools || (ts as any).school;
            return Array.isArray(s) ? s[0] : s;
          })
          .filter(s => s && s.id && s.name);

        // Remove duplicates just in case
        const uniqueSchools = Array.from(new Map(schoolList.map((s: any) => [s.id, s])).values()) as School[];
        
        console.log('SchoolContext - uniqueSchools:', uniqueSchools);
        setSchools(uniqueSchools);
        setLoading(false);

        const storedSchoolId = localStorage.getItem('active_school_id');
        if (storedSchoolId) {
          const stored = uniqueSchools.find((s: School) => s.id === storedSchoolId);
          if (stored) {
            setActiveSchoolState(stored);
          } else if (uniqueSchools.length > 0 && uniqueSchools[0]) {
            setActiveSchoolState(uniqueSchools[0]);
            localStorage.setItem('active_school_id', uniqueSchools[0].id);
          }
        } else if (uniqueSchools.length > 0 && uniqueSchools[0]) {
          setActiveSchoolState(uniqueSchools[0]);
          localStorage.setItem('active_school_id', uniqueSchools[0].id);
        }
      } else {
        console.log('SchoolContext - No schools found');
        setSchools([]);
        setActiveSchoolState(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
      setLoading(false);
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
    <SchoolContext.Provider value={{ schools, activeSchool, setActiveSchool, loading, refreshSchools }}>
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
