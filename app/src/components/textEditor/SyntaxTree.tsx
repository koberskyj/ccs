
import { useEffect, useMemo, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape, { type StylesheetStyle } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { CCSNode, CCSProgram } from '@/types';
import { handleExport, transformAstToSyntaxTree } from '@/lib/ccsToSyntaxTree';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import cysvg from 'cytoscape-svg';

cytoscape.use(dagre);
cytoscape.use(cysvg);

const mainStylesheet: StylesheetStyle[] = [
  {
    selector: 'core',
    // @ts-ignore
    style: {
      'active-bg-size': 0,
    }
  },
  {
    selector: 'node',
    style: {
      'background-opacity': 0,
      'border-width': 0,
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-family': 'Consolas, "Courier New", monospace',
      'font-size': '20px',
      'events': 'no',
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 1,
      'line-color': '#000',
      'target-arrow-color': '#000',
      'target-arrow-shape': 'triangle', 
      'curve-style': 'bezier',
      'arrow-scale': 0.8,
      'events': 'no'
    }
  },


  {
    selector: '.process-name',
    style: {
      'color': '#00796b',
      'font-weight': 'bold'
    }
  },
  { // 0, Nil, tau (a root Program)
    selector: '.keyword',
    style: {
      'color': '#7e57c2',
      'font-weight': 'normal'
    }
  },
  {
    selector: '.root-node',
    style: {
      'color': '#7e57c2',
      'font-size': '14px',
      'text-transform': 'uppercase'
    }
  },
  { // Vstupní akce (a, b)
    selector: '.input-action',
    style: {
      'color': '#1976d2'
    }
  },
  { // Výstupní akce ('a, 'b)
    selector: '.output-action',
    style: {
      'color': '#1976d2',
    }
  },
  { // +, |, \, =
    selector: '.operator',
    style: {
      'color': '#546e7a',
      'font-size': '24px',
      'font-weight': 'bold'
    }
  }
];

export type SyntaxTreeProps = {
  parsedAst: CCSProgram | CCSNode | null;
  onHoverNode?: (range: { from: number; to: number } | null) => void;
  onContentResize?: (size: { width: number, height: number }) => void;
} & React.ComponentProps<"div">;

export default function SyntaxTree({ parsedAst, onHoverNode, onContentResize, className, ...props }: SyntaxTreeProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const elements = useMemo(() => {
    return transformAstToSyntaxTree(parsedAst);
  }, [parsedAst]);

  const fitGraph = (cy: cytoscape.Core) => {
    cy.resize();
    cy.fit(undefined, 5); 

    if(cy.zoom() > 1.15) {
      cy.zoom(1.15);
      cy.center();
    }
    if(cy.zoom() < 0.6) {
      cy.zoom(0.6);
      cy.center();
    }

    const currentPan = cy.pan();
    cy.pan({ x: currentPan.x, y: currentPan.y });
  };

  useEffect(() => {
    const cy = cyRef.current;
    if(!cy) {
      return;
    }

    if(cy) {
      const layout = cy.layout({
        name: 'dagre',
        // @ts-ignore
        rankDir: 'TB',
        spacingFactor: 0.7,
        nodeSep: 70,
        rankSep: 70,
        fit: false, // Custom fit in layoutstop
      });

      layout.on('layoutstop', () => {
        const bb = cy.elements().boundingBox();
        if(onContentResize) {
          onContentResize({ width: bb.w + 50, height: bb.h + 0 });
        }

        fitGraph(cy);
      });
      layout.run();
    }
  }, [elements, onContentResize]);

  useEffect(() => {
    if(!containerRef.current) {
      return;
    }

    const ro = new ResizeObserver(() => {
      if(cyRef.current) {
        requestAnimationFrame(() => {
          if(cyRef.current) {
            fitGraph(cyRef.current);
          }
        });
      }
    });
    ro.observe(containerRef.current);

    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)} {...props}>

      <div className="absolute top-4 right-0 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="bg-stone-100/50 backdrop-blur-sm shadow-sm hover:bg-stone-50 cursor-pointer">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport(cyRef.current, 'png')}>
              Stáhnout jako PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(cyRef.current, 'svg')}>
              Stáhnout jako SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(cyRef.current, 'json')}>
              Stáhnout jako JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={mainStylesheet}
        textureOnViewport={false}
        hideEdgesOnViewport={false}
        pixelRatio={1.5}
        cy={(cy) => {
          cyRef.current = cy;
          cy.container()!.style.cursor = 'grab';
          cy.autoungrabify(true);
          cy.boxSelectionEnabled(false);
          cy.maxZoom(1.15);

          if (onHoverNode) {
            cy.on('mousemove', (e) => {
              const pos = e.position;

              const hitNode = cy.nodes().filter((n) => {
                const bb = n.boundingBox();
                return pos.x >= bb.x1 && pos.x <= bb.x2 && pos.y >= bb.y1 && pos.y <= bb.y2;
              }).first();

              if(hitNode.length > 0) {
                const start = hitNode.data('locStart');
                const end = hitNode.data('locEnd');

                if(typeof start === 'number' && typeof end === 'number') {
                  onHoverNode({ from: start, to: end });
                }
              } else {
                onHoverNode(null);
              }
            });

            cy.on('mouseout', () => {
              onHoverNode(null);
            });
          }
        }}
      />
    </div>
  );
};
