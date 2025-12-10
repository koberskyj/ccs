import CytoscapeComponent from 'react-cytoscapejs';
import type { ElementDefinition, StylesheetStyle } from 'cytoscape';
import { useRef, useEffect } from 'react';
import type { Core } from 'cytoscape';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

const graphStyle: StylesheetStyle[] = [
  {
    selector: 'node[type="process"], node[type="intermediate"]',
    style: {
      'background-color': '#FFD700',
      'label': 'data(label)',
      'color': '#000',
      'text-valign': 'center',
      'text-halign': 'center',
      'width': 40, 'height': 40,
      'border-width': 1, 'border-color': '#000'
    }
  },
  {
    selector: 'node[type="nil"]',
    style: {
      'background-color': '#ddd',
      'label': '0',
      'text-valign': 'center',
      'text-halign': 'center',
      'width': 25, 'height': 25,
      'border-width': 1, 'border-color': '#888'
    }
  },
  {
    selector: 'node[type="operator"]',
    style: {
      'background-color': '#fff',
      'label': 'data(label)',
      'shape': 'round-rectangle',
      'border-width': 1, 'border-color': '#000',
      'text-valign': 'center', 'text-halign': 'center'
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#000',
      'target-arrow-color': '#000',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': 14,
      'text-rotation': 'autorotate',
      'text-margin-y': -10
    }
  }
];

type CCSVisualizerProps = {
  elements?: ElementDefinition[];
}

cytoscape.use(dagre);

function CCSVisualizer({ elements, ...props }: CCSVisualizerProps) {
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if(cyRef.current) {
      const layout = cyRef.current.layout({
        name: 'dagre',
        rankDir: 'LR',
        animate: true,
        animationDuration: 500,
        nodeSep: 50,
        rankSep: 100
      } as any);
      layout.run();
    }
  }, [elements]);

  return (
    <div className="flex flex-col gap-5">
      <div className="w-full h-[500px] border border-gray-300 rounded-md overflow-hidden">
        <CytoscapeComponent
          elements={elements ?? []}
          style={{ width: '100%', height: '100%' }}
          stylesheet={graphStyle}
          cy={(cy) => { cyRef.current = cy; }}
        />
      </div>
    </div>
  );
};

export default CCSVisualizer;