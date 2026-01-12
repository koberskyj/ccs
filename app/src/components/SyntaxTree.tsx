
import { useEffect, useMemo, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape, { type StylesheetStyle } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { CCSNode, CCSProgram } from '@/types';
import { transformAstToSyntaxTree } from '@/lib/ccsToSyntaxTree';

cytoscape.use(dagre);

const academicStylesheet: StylesheetStyle[] = [
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
      'color': '#d32f2f',
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
}

export default function SyntaxTree({ parsedAst, onHoverNode }: SyntaxTreeProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = useMemo(() => {
    return transformAstToSyntaxTree(parsedAst);
  }, [parsedAst]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (cyRef.current) {
      const layout = cyRef.current.layout({
        name: 'dagre',
        // @ts-ignore
        rankDir: 'TB',
        spacingFactor: 0.7,
        nodeSep: 60,
        rankSep: 70,
        fit: false, // Custom fit in layoutstop
      });

      layout.on('layoutstop', () => {
        cy.fit(undefined, 10); 

        if(cy.zoom() > 1.15) {
          cy.zoom(1.15);
          cy.center();
        }

        const bb = cy.elements().boundingBox();
        const currentZoom = cy.zoom();
        const currentPan = cy.pan();
        const newPanY = 0 - (bb.y1 * currentZoom);
        
        cy.pan({ x: currentPan.x, y: newPanY });
      });
      layout.run();
    }
  }, [elements]);

  return (
    <div style={{ border: '1px solid #ccc', height: '500px', width: '350px', backgroundColor: '#fff' }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={academicStylesheet}
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
