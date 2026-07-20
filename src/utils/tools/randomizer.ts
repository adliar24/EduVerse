import { Student, GroupResult, GroupingMode, NamingType, DistributionStrategy } from '../../types/tools';

// Fisher-Yates Shuffle Algorithm
export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateGroups = (
  students: Student[],
  mode: GroupingMode,
  value: number,
  strategy: DistributionStrategy,
  namingPattern: string,
  customNames: string[] = [],
  namingType: NamingType = 'auto'
): GroupResult[] => {
  const totalStudents = students.length;
  if (totalStudents === 0) return [];

  const baseName = namingPattern.trim() || 'Kelompok';
  let groups: GroupResult[] = [];
  let numGroups = 0;

  // 1. Determine Number of Groups
  if (mode === GroupingMode.BY_COUNT) {
    numGroups = Math.max(1, Math.min(value, totalStudents));
  } else if (mode === GroupingMode.BY_SIZE) {
    const groupSize = Math.max(1, value);
    numGroups = Math.ceil(totalStudents / groupSize);
  }

  // 2. Initialize Groups
  for (let i = 0; i < numGroups; i++) {
    let groupName = `${baseName} ${i + 1}`;
    if (namingType === 'custom' && customNames[i]) {
      groupName = customNames[i];
    }
    groups.push({
      id: `g-${i}`,
      name: groupName,
      members: [],
    });
  }

  let studentsToDistribute = [...students];

  // 3. Logic based on Strategy
  if (strategy === DistributionStrategy.ABILITY_HETEROGENEOUS) {
    // HETEROGENEOUS: Mix high and low proficiency in each group
    // Sort students by proficiency Score DESC (4, 3, 2, 1, undefined)
    studentsToDistribute.sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0));
    
    const tier4 = shuffleArray(studentsToDistribute.filter(s => s.proficiency === 4));
    const tier3 = shuffleArray(studentsToDistribute.filter(s => s.proficiency === 3));
    const tier2 = shuffleArray(studentsToDistribute.filter(s => s.proficiency === 2));
    const tier1 = shuffleArray(studentsToDistribute.filter(s => s.proficiency === 1));
    const tierNone = shuffleArray(studentsToDistribute.filter(s => !s.proficiency));
    
    const sortedAndShuffled = [...tier4, ...tier3, ...tier2, ...tier1, ...tierNone];
    
    sortedAndShuffled.forEach((student, index) => {
      groups[index % numGroups].members.push(student);
    });

  } else if (strategy === DistributionStrategy.GENDER_BALANCE) {
    // GENDER BALANCE ONLY (Random Ability)
    const males = students.filter(s => s.gender === 'M');
    const females = students.filter(s => s.gender === 'F');
    const unknown = students.filter(s => !s.gender);

    const shuffledMales = shuffleArray(males);
    const shuffledFemales = shuffleArray(females);
    const shuffledUnknown = shuffleArray(unknown);

    let currentIndex = 0;
    shuffledMales.forEach(student => {
      groups[currentIndex % numGroups].members.push(student);
      currentIndex++;
    });

    currentIndex = 0;
    shuffledFemales.forEach(student => {
      groups[currentIndex % numGroups].members.push(student);
      currentIndex++;
    });

    shuffledUnknown.forEach(student => {
      // Load balance unknowns
      let minSize = Infinity;
      let targetGroupIndex = 0;
      for(let i=0; i<numGroups; i++) {
          if(groups[i].members.length < minSize) {
              minSize = groups[i].members.length;
              targetGroupIndex = i;
          }
      }
      groups[targetGroupIndex].members.push(student);
    });
    
    groups.forEach(g => { g.members = shuffleArray(g.members) });

  } else if (strategy === DistributionStrategy.GENDER_AND_ABILITY_HETEROGENEOUS) {
    // NEW: GENDER BALANCE + HETEROGENEOUS ABILITY
    
    // 1. Separate Gender
    const males = students.filter(s => s.gender === 'M');
    const females = students.filter(s => s.gender === 'F');
    const unknown = students.filter(s => !s.gender);

    // 2. Sort Each Gender by Ability DESC (Best first)
    males.sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0));
    females.sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0));
    unknown.sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0));

    // 3. Distribute Males
    let currentIndex = 0;
    males.forEach(student => {
      groups[currentIndex % numGroups].members.push(student);
      currentIndex++;
    });

    // 4. Distribute Females 
    currentIndex = 0;
    females.forEach(student => {
      groups[currentIndex % numGroups].members.push(student);
      currentIndex++;
    });

    // 5. Distribute Unknowns (Smart fill)
    unknown.forEach(student => {
      // Find group with fewest members to maintain size balance
      let minSize = Infinity;
      let targetGroupIndex = 0;
      
      // Simple loop to find min
      for(let i=0; i<numGroups; i++) {
        if(groups[i].members.length < minSize) {
           minSize = groups[i].members.length;
           targetGroupIndex = i;
        }
      }
      groups[targetGroupIndex].members.push(student);
    });

    // 6. Final Shuffle Internal Order
    groups.forEach(g => { g.members = shuffleArray(g.members) });

  } else {
    // RANDOM (Default)
    const shuffled = shuffleArray(studentsToDistribute);
    shuffled.forEach((student, index) => {
      groups[index % numGroups].members.push(student);
    });
  }

  // Final cleanup: Ensure random internal order if strictly sorted (like Homogeneous or Hetero)
  if (strategy === DistributionStrategy.ABILITY_HETEROGENEOUS || strategy === DistributionStrategy.GENDER_AND_ABILITY_HETEROGENEOUS) {
      groups.forEach(g => { g.members = shuffleArray(g.members) });
  }

  return groups;
};
