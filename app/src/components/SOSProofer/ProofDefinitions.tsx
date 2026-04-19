import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import type { CCSDefinition } from '@/types';
import CCSViewer from '../custom/CCSViewer';
import { ccsToString } from '@/lib/ccsUtils';


export function ProofDefinitions({ children, definitions }: { children: React.ReactNode, definitions: CCSDefinition[] }) {
  const { t } = useTranslation();

  const processDefinitions: Record<string, string> = {};
  definitions.forEach(node => {
    if(node.type === 'Definition') {
      processDefinitions[node.name] = ccsToString(node.process); 
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">{t('sos.allProcessDefinitions')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 pb-4">
          <div>
            {definitions && definitions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {definitions.map((def, index) => (
                  <div key={index} className="flex flex-wrap items-center py-1 font-mono">        
                    <CCSViewer 
                      code={def.name + " = " + ccsToString(def.process)} 
                      className="w-auto! wrap-break-word flex-1" 
                      definitions={processDefinitions} 
                    />
                  </div>
                ))}
              </div>
            ) : (<>

            </>)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}