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
          .map((ts): School | null => {
            // Support both direct object and array returns from Supabase joins
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

        // Deduplicate schools by name, preferring canonical ID fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7
        const uniqueByNameMap = new Map<string, School>();
        for (const s of schoolList) {
          const key = s.name.toLowerCase().trim();
          if (!uniqueByNameMap.has(key) || s.id === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7') {
            uniqueByNameMap.set(key, s);
          }
        }
        const uniqueSchools = Array.from(uniqueByNameMap.values());
        
        console.log('SchoolContext - uniqueSchools:', uniqueSchools);
        if (uniqueSchools.length > 0) {
          setSchools(uniqueSchools);
          setLoading(false);

          const storedSchoolId = localStorage.getItem('active_school_id');
          const stored = storedSchoolId ? uniqueSchools.find((s: School) => s.id === storedSchoolId) : null;
          const active = stored || uniqueSchools.find(s => s.id === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7') || uniqueSchools[0];
          setActiveSchoolState(active);
          if (active?.id) {
            localStorage.setItem('active_school_id', active.id);
          }
          return;
        }
      }

      // Fallback: Fetch directly from 'schools' table if teacher_schools mapping is empty/null
      const { data: allSchools } = await supabase.from('schools').select('*');
      if (allSchools && allSchools.length > 0) {
        const schoolList: School[] = allSchools.map((s: any) => ({
          id: s.id,
          name: s.name || s.nama || 'Sekolah',
          address: s.address || s.alamat || ''
        }));
        const uniqueByNameMap = new Map<string, School>();
        for (const s of schoolList) {
          const key = s.name.toLowerCase().trim();
          if (!uniqueByNameMap.has(key) || s.id === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7') {
            uniqueByNameMap.set(key, s);
          }
        }
        const fallbackSchools = Array.from(uniqueByNameMap.values());
        setSchools(fallbackSchools);
        const storedSchoolId = localStorage.getItem('active_school_id');
        const active = fallbackSchools.find(s => s.id === storedSchoolId) || fallbackSchools.find(s => s.id === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7') || fallbackSchools[0];
        setActiveSchoolState(active);
        if (active?.id) {
          localStorage.setItem('active_school_id', active.id);
        }
      } else {
        console.log('SchoolContext - No schools found');
        setSchools([]);
        setActiveSchoolState(null);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
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
