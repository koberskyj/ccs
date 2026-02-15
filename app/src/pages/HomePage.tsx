

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import ProgramList from "@/components/selector/ProgramList";
import ProgramWorkspace from "@/components/selector/ProgramWorkspace";

function Homepage() {
  const { t } = useTranslation();

  return (
    <div className='p-4 pt-0'>
      <div className="mb-6">
        <Card className="relative group transition-transform animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <CardHeader>
            <CardTitle className="text-xl">{t('core.selectProgram')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgramList />
          </CardContent>
        </Card>
      </div>
      
      <ProgramWorkspace />
    </div>
  );
}

export default Homepage;