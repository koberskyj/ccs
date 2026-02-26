
import { useTranslation } from "react-i18next";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const tutorialTranslations = {
  cs: {
    basicInfo: "Základní informace o aplikaci",
    basicInfoP1: "Tato webová aplikace slouží k návrhu, vizualizaci a analýze procesů popsaných v <b>Kalkulu komunikujících systémů (CCS)</b>. Umožňuje uživatelům definovat vlastní CCS modely, generovat k nim odpovídající ohodnocené přechodové systémy (LTS) a interaktivně konstruovat důkazy pomocí pravidel strukturální operační sémantiky (SOS).",
    basicInfoP2: "Na výchozí kartě <i>„Výběr CCS programu“</i> naleznete seznam programů, které jsou lokálně uloženy ve vašem zařízení. Pro inspiraci obsahuje aplikace sadu předdefinovaných ukázkových programů. Tyto programy lze libovolně upravovat, mazat či exportovat. Export je možný buď zkopírováním do schránky, nebo stažením ve formátu JSON, který poté můžete přeposlat ostatním uživatelům.",
    basicInfoP3: "Každý projekt se skládá z <b>CCS programu</b> (textové CCS definice procesů) a z odpovídajících <b>karet</b>, které se dělí na dva typy:",
    basicInfoLi1: "<b>SOS Důkaz:</b> Slouží k interaktivní tvorbě důkazu na základě SOS pravidel.",
    basicInfoLi2: "<b>Simulace procesů:</b> Slouží k vizualizaci grafu LTS jednotlivých procesů.",
    
    syntax: "Syntaxe jazyka CCS",
    syntaxP1: "Vstupní syntaxe vychází z klasické formální definice CCS. <b>Procesní konstanty</b> musí začínat velkým písmenem (např. <span class=\"font-mono\">Spec,Pub,CS</span>), <b>akční prefixy</b> začínají malým písmenem. <b>Výstupní akce</b> obsahuje před tímto písmenem apostrof (např. <span class=\"font-mono\">'out</span>).",
    syntaxP2: "Jednotlivé řádky nevyžadují ukončení středníkem. Jednořádkové komentáře lze do kódu vložit pomocí prefixu '<span class=\"font-mono\">//</span>'. V případě nalezení syntaktické nebo sémantické chyby v definici programu se pod textovým editorem automaticky zobrazí chybová hláška.",
    syntaxP3: "Při zadání korektního výrazu CCS se vedle editoru zobrazí <b>syntaktický strom (AST)</b>, který je možné exportovat do formátů PNG, SVG nebo JSON. Po najetí kurzorem na jednotlivé uzly stromu dojde k vizuálnímu zvýraznění příslušné části kódu v textovém editoru.",
    
    proof: "Tvorba důkazu pomocí SOS pravidel",
    proofP1: "Kompletní přehled odvozovacích SOS pravidel (včetně jejich formálních definic) je vždy dostupný u příslušné karty. Pro odvození platného přechodu je nutné specifikovat výchozí proces, přechodovou akci a cílový (následný) proces. Důkazy lze tvořit ve dvou režimech: buďto v <b>režimu nápovědy</b> (systém filtruje a nabízí pouze aktuálně aplikovatelná pravidla a jejich platné stavy), nebo <b>bez nápovědy</b>.",
    proofP2: "Nastavení nápovědy a vstupních parametrů důkazu lze uzamknout vypnutím editace programu.",
    
    simulation: "Simulace procesů a vizualizace LTS",
    simP1: "Po definování počátečního stavu systém vygeneruje odpovídající LTS graf pomocí pravidel SOS. Generování je deterministické – ekvivalentní zadání povede ke strukturně shodnému grafu. Graf se skládá z <b>vrcholů</b>, reprezentujících jednotlivé stavy procesu, a orientovaných <b>hran</b>, značící dostupné přechodové akce.",
    simP2: "Grafem je možné interaktivně procházet pomocí <b>simulačního panelu</b>, umístěného vlevo dole. Aktuální stav simulace je ve vizualizaci zvýrazněn modrou barvou. Při interakci se simulačním panelem se zvýrazní hrany a jejich cílové vrcholy. Vizualizaci LTS lze rovněž exportovat do PNG, SVG a JSON.",
    simP3: "Při práci s rozsáhlejšími procesy lze aktivovat <b>strukturální redukci</b>. Tato funkce graf zjednoduší odstraněním stavů, které jsou strukturálně ekvivalentní (např. <span class=\"font-mono\">A|B</span> spojí s <span class=\"font-mono\">B|A</span>). Tato redukce se vztahuje i na <i>restrikce</i> a <i>přejmenování</i>. U nekonečných, nebo velkých grafů, je možné použít <b>dynamické dočítání</b>, které generuje vrcholy postupně průchodem grafu. Pro lepší orientaci je možné také změnit formát popisku vrcholů nebo si zapnout funkci centrování na aktuální stav.",
    
    newProg: "Vytvoření nového programu",
    newProgP1: "Nový program lze do aplikace importovat, nebo jej založit. Při zakládání je nutné zadat <b>název</b> a volitelně i <b>textový popis</b>. Při počáteční nastavení je doporučeno zanechat povolenou editaci, aby bylo možné v programu definovat CCS kód a přidat karty (práva k editaci lze kdykoli měnit).",
    newProgP2: "Po vytvoření můžete nadefinovat jednotlivé procesy v <b>textovém editoru</b>. K programu je možné přidávat karty pro konstrukci SOS důkazů či vizualizaci LTS. Každou změnu <b>nezapomeňte vždy uložit</b>. Pokud máte neuložené změny, zobrazí se nad textovým editorem výzva pro uložení či zahození změn. Ukládání se týká jak zdrojového kódu CCS, tak karet samotných."
  },
  en: {
    basicInfo: "Basic information about the application",
    basicInfoP1: "This web application is used for the design, visualization, and analysis of processes described in the <b>Calculus of Communicating Systems (CCS)</b>. It allows users to define their own CCS models, generate corresponding Labelled Transition Systems (LTS), and interactively construct proofs using the rules of Structural Operational Semantics (SOS).",
    basicInfoP2: "On the default <i>\"Select CCS program\"</i> tab, you will find a list of programs stored locally on your device. For inspiration, the application includes a set of predefined sample programs. These programs can be freely edited, deleted, or exported. Export is possible either by copying to the clipboard or downloading in JSON format, which you can then share with other users.",
    basicInfoP3: "Each project consists of a <b>CCS program</b> (CCS definition of processes) and corresponding <b>tabs</b>, which are divided into two types:",
    basicInfoLi1: "<b>SOS Proof:</b> Used for interactive proof creation based on SOS rules.",
    basicInfoLi2: "<b>Process Simulation:</b> Used for the visualization of the LTS graph of individual processes.",
    
    syntax: "CCS language syntax",
    syntaxP1: "The input syntax is based on the classic formal definition of CCS. <b>Process constants</b> must start with a capital letter (e.g., <span class=\"font-mono\">Spec,Pub,CS</span>), and <b>action prefixes</b> start with a lowercase letter. An <b>output action</b> contains an apostrophe before this letter (e.g., <span class=\"font-mono\">'out</span>).",
    syntaxP2: "Individual lines do not require termination with a semicolon. Single-line comments can be inserted into the code using the '<span class=\"font-mono\">//</span>' prefix. In case of a syntactic or semantic error in the program definition, an error message will automatically appear below the text editor.",
    syntaxP3: "Upon entering a valid CCS expression, an <b>Abstract Syntax Tree (AST)</b> is displayed next to the editor, which can be exported to PNG, SVG, or JSON formats. Hovering the cursor over individual tree nodes will visually highlight the corresponding part of the code in the text editor.",
    
    proof: "Proof creation using SOS rules",
    proofP1: "A complete overview of the SOS derivation rules (including their formal definitions) is always available on the respective tab. To derive a valid transition, it is necessary to specify the source process, the transition action, and the target (subsequent) process. Proofs can be created in two modes: either in <b>hint mode</b> (the system filters and offers only currently applicable rules and their valid states), or <b>without hints</b>.",
    proofP2: "Proof settings and input parameters can be locked by disabling program editing.",
    
    simulation: "Process simulation and LTS visualization",
    simP1: "After defining the initial state, the system generates the corresponding LTS graph using SOS rules. This generation is deterministic – equivalent inputs will lead to a structurally identical graph. The graph consists of <b>vertices</b>, representing individual states of the process, and directed <b>edges</b>, indicating available transition actions.",
    simP2: "You can interactively navigate through the graph using the <b>simulation panel</b> located at the bottom left. The current simulation state is highlighted in blue in the visualization. When interacting with the simulation panel, the edges and their target vertices are highlighted. The LTS visualization can also be exported to PNG, SVG, and JSON.",
    simP3: "When working with more extensive processes, <b>structural reduction</b> can be activated. This function simplifies the graph by removing states that are structurally equivalent (e.g., combining <span class=\"font-mono\">A|B</span> with <span class=\"font-mono\">B|A</span>). This reduction also applies to <i>restrictions</i> and <i>renaming</i>. For infinite or large graphs, you can use <b>dynamic loading</b>, which generates vertices progressively as you traverse the graph. For better orientation, it is also possible to change the format of the vertex labels or enable the center-on-current-state function.",
    
    newProg: "Creating a new program",
    newProgP1: "A new program can be imported into the application or created from scratch. When creating it, you must enter a <b>name</b> and optionally a <b>text description</b>. During the initial setup, it is recommended to leave editing enabled so that you can define CCS code and add tabs to the program (editing rights can be changed at any time).",
    newProgP2: "After creation, you can define individual processes in the <b>text editor</b>. You can add tabs for the construction of SOS proofs or LTS visualization to the program. <b>Do not forget to always save</b> every change. If you have unsaved changes, a prompt to save or discard changes will appear above the text editor. Saving applies to both the CCS source code and the tabs themselves."
  }
};

export default function Tutorial({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'cs';
  const lang = tutorialTranslations[currentLang];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">{t('core.help')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-8 pb-4">
          <div>
            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5">
              {lang.basicInfo}
            </h3>
            <div className="space-y-2">
              <p dangerouslySetInnerHTML={{ __html: lang.basicInfoP1 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.basicInfoP2 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.basicInfoP3 }} />
              <ul className="list-disc pl-6">
                <li dangerouslySetInnerHTML={{ __html: lang.basicInfoLi1 }} />
                <li dangerouslySetInnerHTML={{ __html: lang.basicInfoLi2 }} />
              </ul>
            </div>

            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5 pt-5">
              {lang.syntax}
            </h3>
            <div className="space-y-3">
              <p dangerouslySetInnerHTML={{ __html: lang.syntaxP1 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.syntaxP2 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.syntaxP3 }} />
            </div>

            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5 pt-5">
              {lang.proof}
            </h3>
            <div className="space-y-3">
              <p dangerouslySetInnerHTML={{ __html: lang.proofP1 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.proofP2 }} />
            </div>

            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5 pt-5">
              {lang.simulation}
            </h3>
            <div className="space-y-3">
              <p dangerouslySetInnerHTML={{ __html: lang.simP1 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.simP2 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.simP3 }} />
            </div>

            <h3 className="font-semibold mb-4 text-primary border-b border-foreground/20 pb-1.5 pt-5">
              {lang.newProg}
            </h3>
            <div className="space-y-3">
              <p dangerouslySetInnerHTML={{ __html: lang.newProgP1 }} />
              <p dangerouslySetInnerHTML={{ __html: lang.newProgP2 }} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}