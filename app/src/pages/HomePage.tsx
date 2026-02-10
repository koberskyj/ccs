
import SimulationWithGraph from "@/components/SimulationWithGraph";
import ProofWrapper from "@/components/SOSProofer/ProofWrapper";
import EditorWrap from "@/components/textEditor/EditorWrap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CCSProgram } from "@/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function Homepage() {
  const { t } = useTranslation();
  const [ccsInput, setCcsInput] = useState<CCSProgram|null>(null);

  const handleInputChange = (input: CCSProgram) => {
    setCcsInput(input);
  };

  return (
    <div className='p-4 pt-0'>
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('core.selectProgram')}</CardTitle>
          </CardHeader>
          <CardContent>
          </CardContent>
        </Card>
      </div>
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('core.program', { name: 'Main' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorWrap initValue={`

A = a.A
B = ((A|'a.0)|b.0)[c/a]
`} onSubmit={handleInputChange} />
          </CardContent>
        </Card>
      </div>
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('core.proof')}</CardTitle>
          </CardHeader>
          <CardContent>
            { ccsInput && <ProofWrapper program={ccsInput}/> }
          </CardContent>
        </Card>
      </div>
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('core.simulation')}</CardTitle>
          </CardHeader>
          <CardContent>
            { ccsInput && <SimulationWithGraph ast={ccsInput} /> }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Homepage;