import React, { createContext, useState, useEffect } from 'react';
import BASE_PROGRAMS from '@/baseProgramList.json';
import type { ProgramSave } from '@/types';
import { toast } from 'sonner';
import { validateProgramDefinition } from '@/lib/importUtils';
import { t } from 'i18next';

const basePrograms = BASE_PROGRAMS as ProgramSave[];
export const STORAGE_KEY = 'program-list';
export const STORAGE_KEY_SELECTED = 'program-selected';
export const STORAGE_KEY_LATEST_DATE = 'program-latest-date';

export interface ProgramsContextType {
  programs: ProgramSave[];
  activeProgram: ProgramSave | null;
  selectedProgramIndex: number | null;
  isDirty: boolean;
  setIsDirty: (val: boolean) => void;
  addProgram: (program: ProgramSave) => void;
  updateProgram: (index: number, updatedProgram: ProgramSave) => void;
  deleteProgram: (index: number) => void;
  selectProgram: (index: number | null) => void;
}

export const ProgramsContext = createContext<ProgramsContextType | undefined>(undefined);

export function ProgramsProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<ProgramSave[]>([]);
  const [selectedProgramIndex, setSelectedProgramIndex] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const fetchSupplementaryPrograms = async (currentPrograms: ProgramSave[]) => {
    try {
      const response = await fetch('/supplementaryPrograms.json');
      if(!response.ok) {
        toast.warning(t('selector.suppProgramError'));
        throw new Error('Error while downloading a supplementary programs file.');
      }
      
      let data = [];
      try {
        data = await response.json();
        if(!Array.isArray(data)) {
          throw new Error('Expected an array of programs.');
        }
      }
      catch (e) {
        console.warn('Supplementary programs have bad syntax: ', e);
        toast.warning(t('selector.suppProgramError'));
      }

      const latestProcessedDateStr = localStorage.getItem(STORAGE_KEY_LATEST_DATE) || '0';
      const latestProcessedTime = parseInt(latestProcessedDateStr, 10);
      const now = Date.now();
      
      let newMaxTime = latestProcessedTime;
      const programsToAdd: ProgramSave[] = [];

      data.forEach((prog: any) => {
        const validationResult = validateProgramDefinition(prog);
        if(validationResult !== true) {
          console.warn(`Supplementary program "${prog.name || 'Unknown'}" error:`, validationResult);
          toast.error(t('selector.suppProgramWarning', { name: prog.name || 'Unknown' })+" "+validationResult);
          return;
        }

        const progTime = new Date(prog.dateFrom).getTime();
        if(progTime <= now && progTime > latestProcessedTime) {
          programsToAdd.push(prog);
          if(progTime > newMaxTime) {
            newMaxTime = progTime;
          }
        }
      });

      if(programsToAdd.length > 0) {
        const updatedPrograms = [...currentPrograms, ...programsToAdd];
        setPrograms(updatedPrograms);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrograms));
        localStorage.setItem(STORAGE_KEY_LATEST_DATE, newMaxTime.toString());
        toast.success(t('selector.suppProgramSuccess'));
      }

    } catch (error) {
      console.warn('Error while loading supplementary programs:', error);
    }
  };

  const loadFromStorage = (initial: boolean) => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const storedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
    let loadedPrograms = basePrograms;

    if(storedData) {
      try {
        loadedPrograms = JSON.parse(storedData);
        setPrograms(loadedPrograms);
        if(initial) {
          setSelectedProgramIndex(parseInt(storedSelected || '0', 0));
        }
      } 
      catch (e) {
        toast.error(t('selector.programErrorParsing'));
        console.error(e);
        setPrograms(basePrograms);
        loadedPrograms = basePrograms;
      }
    } 
    else {
      setPrograms(basePrograms);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(basePrograms));
      localStorage.setItem(STORAGE_KEY_SELECTED, '0');
    }
    if(initial) {
      fetchSupplementaryPrograms(loadedPrograms);
    }
  };

  useEffect(() => {
    loadFromStorage(true);

    function handleStorageChange(e: StorageEvent) {
      if(e.key === STORAGE_KEY) {
        loadFromStorage(false);
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveToStorage = (newPrograms: ProgramSave[]) => {
    setPrograms(newPrograms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrograms));
  };

  const addProgram = (program: ProgramSave) => {
    const updated = [...programs, program];
    saveToStorage(updated);
  };

  const updateProgram = (index: number, updatedProgram: ProgramSave) => {
    const updated = programs.map((p, i) => (i === index ? updatedProgram : p));
    saveToStorage(updated);
  };

  const deleteProgram = (index: number) => {
    const updated = programs.filter((_, i) => i !== index);
    saveToStorage(updated);
    if(selectedProgramIndex === index) {
      setSelectedProgramIndex(null);
    }
  };

  const selectProgram = (index: number | null) => {
    setSelectedProgramIndex(index);
    localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(index));
  };

  const activeProgram = selectedProgramIndex !== null && programs[selectedProgramIndex] ? programs[selectedProgramIndex] : null;

  return (
    <ProgramsContext.Provider value={{
      programs,
      activeProgram,
      selectedProgramIndex,
      isDirty,
      setIsDirty,
      addProgram,
      updateProgram,
      deleteProgram,
      selectProgram
    }}>
      {children}
    </ProgramsContext.Provider>
  );
};