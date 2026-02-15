import { usePrograms } from '@/utils/usePrograms';
import ButtonHover from '../custom/ButtonHover';
import { Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ImportProgram } from './ImportProgram';
import { ProgramCreator } from './ProgramCreator';
import type { ProgramSave } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ProgramListType = { 
  
} & React.ComponentProps<"div">;

export default function ProgramList({ ...props }: ProgramListType) {
  
  const { programs, activeProgram, selectProgram, addProgram, updateProgram, deleteProgram } = usePrograms();

  const handleDownload = (e: React.MouseEvent, program: ProgramSave) => {
    e.stopPropagation();
    
    const jsonString = JSON.stringify(program, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const safeName = program.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeName}.json`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.info(`Definice programu ${program.name.toLocaleLowerCase()} byla stažena.`);
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const programName = programs[index].name;
    if (window.confirm("Opravdu chcete program '"+programName+"' odstranit? Tato akce je nevratná.")) {
      deleteProgram(index);
      selectProgram(0);
      toast.info(`Program ${programName.toLocaleLowerCase()} byl odstraněn.`);
    }
  };

  const copyMachine = (id: number) => {
    navigator.clipboard.writeText(JSON.stringify(programs[id]));
    toast.info(`Definice programu ${programs[id].name.toLocaleLowerCase()} byla zkopírována do schránky`);
  }

  const handleNewProgram = (program: ProgramSave) => {
    addProgram(program);
    selectProgram(programs.length - 1);
    toast.info(`Program ${program.name.toLocaleLowerCase()} byl přidán.`);
  }

  return (
    <div {...props}>
      <div>
        <div className='border rounded-md mb-6 max-h-[400px] overflow-auto'>
          {programs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              Nemáte uloženy žádné programy.
            </div>
          )}
          {programs.map((program, idx) => 
            <div key={idx} onClick={() => selectProgram(idx)} 
                className={cn('flex justify-between items-center flex-wrap pl-4 pr-2 border-b last:border-0 cursor-pointer transition-colors', 
                (activeProgram === program ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-primary/5'))}>
              <span className="font-semibold grow-10 select-none">
                {program.name} 
                {program.description ? <span className="text-muted-foreground text-sm font-normal ml-1">- {program.description}</span> : ''}
              </span>
              
              <div className='flex justify-end grow'>
                <ProgramCreator program={program} onUpdate={(updated) => updateProgram(idx, updated)}>
                  <ButtonHover hoverContent={<p>Upravit název a popis programu</p>} variant="ghost" size="icon"
                      className='text-yellow-600 hover:text-yellow-600 hover:bg-yellow-600/10'>
                    <Pencil />
                  </ButtonHover>
                </ProgramCreator>

                <ButtonHover hoverContent={<p>Stáhnout program</p>} variant="ghost" size="icon" onClick={(e) => handleDownload(e, program)}
                    className='text-blue-600 hover:text-blue-600 hover:bg-blue-600/10'>
                  <Download />
                </ButtonHover>

                <ButtonHover hoverContent={<p>Zkopírovat program do schránky</p>} variant="ghost" size="icon" onClick={() => copyMachine(idx)}
                    className='text-stone-600 hover:text-stone-600 hover:bg-stone-600/10'>
                  <Copy />
                </ButtonHover>
                
                <ButtonHover hoverContent={<p>Odstranit program</p>} variant="ghost" size="icon" onClick={(e) => handleDelete(e, idx)} disabled={programs.length <= 1}
                    className='text-red-600 hover:text-red-600 hover:bg-red-600/10 disabled:opacity-30'>
                  <Trash2 />
                </ButtonHover>
              </div>
            </div>
          )}
        </div>
        
        <div className='flex flex-wrap justify-between gap-3'>
          <ProgramCreator onUpdate={handleNewProgram}>
            <Button>Definovat nový program</Button>
          </ProgramCreator>
          
          <ImportProgram onUpdate={handleNewProgram}>
            <Button variant={"secondary"}>Importovat program</Button>
          </ImportProgram>
        </div>
      </div>
    </div>
  );
}