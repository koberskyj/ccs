
import React, { createContext, useState, useEffect } from 'react';
import BASE_PROGRAMS from '@/baseProgramList.json';
import type { ProgramSave } from '@/types';
import { toast } from 'sonner';

const basePrograms = BASE_PROGRAMS as ProgramSave[];
export const STORAGE_KEY = 'program-list';
export const STORAGE_KEY_SELECTED = 'program-selected';

export interface ProgramsContextType {
  programs: ProgramSave[];
  activeProgram: ProgramSave | null;
  selectedProgramIndex: number | null;
  addProgram: (program: ProgramSave) => void;
  updateProgram: (index: number, updatedProgram: ProgramSave) => void;
  deleteProgram: (index: number) => void;
  selectProgram: (index: number | null) => void;
}

export const ProgramsContext = createContext<ProgramsContextType | undefined>(undefined);

export function ProgramsProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<ProgramSave[]>([]);
  const [selectedProgramIndex, setSelectedProgramIndex] = useState<number | null>(null);

  const loadFromStorage = (initial: boolean) => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const storedSelected = localStorage.getItem(STORAGE_KEY_SELECTED);
    if(storedData) {
      try {
        setPrograms(JSON.parse(storedData));
        if(initial) {
          setSelectedProgramIndex(parseInt(storedSelected || '0'));
        }
      } 
      catch (e) {
        toast.error("Chyba při parsování seznamu programů, načítám základní nastavení.");
        console.error(e);
        setPrograms(basePrograms);
      }
    } 
    else {
      setPrograms(basePrograms);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(basePrograms));
      localStorage.setItem(STORAGE_KEY_SELECTED, '0');
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

  const activeProgram = selectedProgramIndex !== null ? programs[selectedProgramIndex] : null;

  return (
    <ProgramsContext.Provider value={{
      programs,
      activeProgram,
      selectedProgramIndex,
      addProgram,
      updateProgram,
      deleteProgram,
      selectProgram
    }}>
      {children}
    </ProgramsContext.Provider>
  );
};