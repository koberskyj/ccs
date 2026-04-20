import CytoscapeComponent from 'react-cytoscapejs';
import type { ElementDefinition, StylesheetStyle, NodeSingular, EventObject, Core } from 'cytoscape';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { ViewMode, EdgeHighlightRequest } from '@/types';
import CCSViewer from '../custom/CCSViewer';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Copy, Download, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { handleExport } from '@/lib/ccsToSyntaxTree';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

cytoscape.use(dagre);

const baseNodeStyle = (mode: ViewMode): StylesheetStyle => ({
  selector: 'node',
  style: {
    'background-color': '#fff101',
    'border-color': '#000000',
    'border-width': 2,
    'color': '#000000',

    'label': 'data(label)',
    'font-size': 'data(fontSize)',

    'text-wrap': 'wrap',
    'text-max-width': '140px',
    'text-valign': 'center',
    'text-halign': 'center',

    'width': mode == 'full' ? 'label' : 40,
    'height': mode == 'full' ? 'label' : 40,
    'shape': mode == 'full' ? 'round-rectangle' : 'ellipse',
    'padding': mode == 'full' ? '6px' : '2px',

    'transition-property': 'background-color, border-width, width, height, font-size',
    'transition-duration': 150
  } as any
});

const stylesheetDef: StylesheetStyle[] = [
  {
    selector: 'core',
    // @ts-ignore
    style: {
      'active-bg-size': 0,
    }
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#000000',
      'target-arrow-color': '#000000',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': 16,
      'color': '#000000',
      'text-background-opacity': 1,
      'text-background-color': '#ffffff',
      'text-background-padding': '2px',
      'text-background-shape': 'roundrectangle',
      'transition-property': 'background-color, border-width, width, height, font-size',
      'transition-duration': 100
    }
  },
  {
    selector: '.active-state',
    style: {
      'background-color': '#b7d6ff',
      'border-width': 2,
      'border-color': '#000000',
      'z-index': 1000
    }
  },
  {
    selector: '.highlighted-target',
    style: {
      'background-color': '#b7d6ff',
      'border-color': '#000',
      'border-width': 2,
      'border-style': 'dashed'
    }
  },
  {
    selector: '.highlighted-edge',
    style: {
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      'width': 3,
      'z-index': 999
    }
  }
];

type LTSGraphProps = {
  elements?: ElementDefinition[];
  activeNodeId: string | null;
  edgeHighlight?: EdgeHighlightRequest;
  viewMode: ViewMode;
  isCentering?: boolean;
  onCreateProofCard?: (sourceCCS: string, targetCCS: string, action: string) => void;
}

type TooltipState = {
  x: number;
  y: number;
  text: string;
  nodeId: string;
  numId: string;
} | null;

type ContextMenuState = {
  x: number;
  y: number;
  type: 'node' | 'edge';
  ccs?: string;
  sourceCcs?: string;
  targetCcs?: string;
  action?: string;
} | null;

export default function LTSGraph({ elements, activeNodeId, edgeHighlight, viewMode, isCentering, onCreateProofCard }: LTSGraphProps) {
  const { t } = useTranslation();
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stylesheet = useMemo(() => {
    return [
      baseNodeStyle(viewMode),
      ...stylesheetDef
    ];
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if(hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if(!cyRef.current || !elements) {
      return;
    }
    const cy = cyRef.current;

    cy.batch(() => {
      cy.nodes().forEach(node => {
        const displayId = node.data('numId') || node.data('id');
        const ccs = node.data('ccs') || "";

        let label = displayId;
        if(viewMode === 'full') {
          label = ccs;
        }
        else if(viewMode === 'mixed') {
          label = ccs.length <= 5 ? ccs : displayId;
        }

        let fontSize = 15;
        if(label.length > 0 && label.length < 5) {
          fontSize = label.length <= 2 ? 22 : 17;
        }

        node.data('label', label);
        node.data('fontSize', fontSize);
      });

      cy.elements().removeClass('active-state highlighted-edge highlighted-target');

      if(activeNodeId) {
        cy.$id(activeNodeId).addClass('active-state');
      }

      if(edgeHighlight) {
        const { sourceId, targetId, action } = edgeHighlight;
        const edges = cy.edges().filter(e => {
          const data = e.data();
          return data.source === sourceId && data.target === targetId && Array.isArray(data.actions) && data.actions.includes(action);
        });

        if(edges.length > 0) {
          edges.addClass('highlighted-edge');
          cy.$id(targetId).addClass('highlighted-target');
        }
      }
    });
  }, [elements, viewMode, activeNodeId, edgeHighlight]);



  useEffect(() => {
    if(!cyRef.current) {
      return;
    }
    const cy = cyRef.current;

    cy.style().update();
    const layout = cy.layout({
      name: 'dagre',
      rankDir: 'LR',
      animate: false,
      fit: false,
      nodeSep: viewMode === 'full' ? 40 : 40,
      rankSep: viewMode === 'full' ? 60 : 60,
      align: 'UL',
      ranker: 'network-simplex'
    } as any);

    layout.on('layoutstop', () => {
      if(!isCentering) {
        cy.fit(cy.elements(), 30);
        if(cy.zoom() > 1.15) {
          cy.zoom(1.15);
          cy.center();
        }
      }
    });

    layout.run();
  }, [viewMode, elements]);

  useEffect(() => {
    if(!cyRef.current) {
      return;
    }
    const cy = cyRef.current;

    if(isCentering && activeNodeId) {
      const activeNode = cy.$id(activeNodeId);
      if(activeNode.length > 0) {
        //cy.stop(true, true);
        cy.animate({
          center: { eles: activeNode },
          zoom: 1.15,
          duration: 250,
          easing: 'ease-in-out',
        });
      }
    }
  }, [activeNodeId, isCentering]);

  const handleMouseOut = useCallback(() => {
    if(hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTooltip(null);
  }, []);
  const handleMouseOver = useCallback((evt: EventObject) => {
    const node = evt.target as NodeSingular;
    const bb = node.renderedBoundingBox();
    const container = containerRef.current;
    if(!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const absoluteX = containerRect.left + bb.x1 + (bb.w / 2);
    const absoluteY = containerRect.top + bb.y1;

    hoverTimeoutRef.current = setTimeout(() => {
      setTooltip({
        x: absoluteX,
        y: absoluteY,
        text: node.data('ccs'),
        nodeId: node.data('id'),
        numId: node.data('numId'),
      });
    }, 250);
  }, []);

  const handleRightClick = useCallback((evt: EventObject) => {
    evt.preventDefault();
    const ele = evt.target;
    const container = containerRef.current;
    if(!container) {
      return;
    }
    
    setTooltip(null);
    const containerRect = container.getBoundingClientRect();
    const absoluteX = containerRect.left + evt.renderedPosition.x;
    const absoluteY = containerRect.top + evt.renderedPosition.y;

    if(ele.isNode()) {
      setContextMenu({
        x: absoluteX,
        y: absoluteY,
        type: 'node',
        ccs: ele.data('ccs')
      });
    } 
    else if (ele.isEdge()) {
      setContextMenu({
        x: absoluteX,
        y: absoluteY,
        type: 'edge',
        sourceCcs: ele.source().data('ccs'),
        targetCcs: ele.target().data('ccs'),
        action: ele.data('label') || ele.data('actions')?.[0] || ''
      });
    }
  }, []);


  useEffect(() => {
    if(!cyRef.current) {
      return;
    }
    const cy = cyRef.current;
    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node, edge', handleMouseOut);
    cy.on('cxttap', 'node, edge', handleRightClick);
    cy.on('tap', () => setContextMenu(null));
    cy.on('pan zoom', () => { handleMouseOut(); setContextMenu(null); });
    cy.on('grab drag', 'node', () => { handleMouseOut(); setContextMenu(null); });

    return () => {
      cy.off('mouseover', 'node', handleMouseOver);
      cy.off('mouseout', 'node, edge', handleMouseOut);
      cy.off('cxttap', 'node, edge', handleRightClick);
      cy.off('tap');
      cy.off('pan zoom');
      cy.off('grab drag');
    };
  }, [handleMouseOver, handleMouseOut, handleRightClick]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('simulation.defCopied'));
    setContextMenu(null);
  };

  const renderTooltip = () => {
    if(!tooltip) {
      return null;
    }

    const GAP = 10;
    const TOOLTIP_WIDTH = 350;
    const top = tooltip.y - GAP;
    const left = tooltip.x;

    const style: React.CSSProperties = {
      position: 'fixed',
      left: left,
      top: top,
      transform: `translate(-50%, -100%)`,
      width: 'max-content',
      maxWidth: `${TOOLTIP_WIDTH}px`,
      zIndex: 99998,
      pointerEvents: 'none'
    };

    return createPortal(
      <div style={style}>
        <div className="animate-in fade-in-0 zoom-in-95 duration-200 px-4 py-3 text-sm bg-popover/90 text-popover-foreground border border-foreground/20 shadow-lg backdrop-blur-sm rounded-lg">
          <div className="font-mono border-b border-stone-400 pb-1 mb-2 font-bold text-xs uppercase tracking-wider flex justify-between">
            <span>{t('core.node')} {tooltip.numId} <span className="text-[0.65rem] text-foreground/50">({tooltip.nodeId})</span></span>
          </div>
          <div className="font-mono wrap-break-word border border-primary/8 bg-[color-mix(in_srgb,var(--primary)_15%,white)] p-2 rounded-md">
            <CCSViewer code={tooltip.text} />
          </div>

          <div className="mt-2 text-[0.75rem] text-muted-foreground italic text-center border-t border-border/50 pt-1">
            {t('simulation.tooltipTip')}
          </div>

          <div className={`absolute w-0 h-0 border-8 border-transparent border-t-popover/95 bottom-0 translate-y-full`}
            style={{ left: '50.25%', transform: `translateX(-50%)`}}>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderContextMenu = () => {
    if(!contextMenu) {
      return null;
    }

    const style: React.CSSProperties = {
      position: 'fixed', left: contextMenu.x, top: contextMenu.y,
      zIndex: 99999
    };

    return createPortal(
      <div style={style} className="bg-popover border border-border shadow-md rounded-md p-1 min-w-40 animate-in fade-in-0 zoom-in-95">
        {contextMenu.type === 'node' ? (
          <button onClick={() => copyToClipboard(contextMenu.ccs!)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2">
            <Copy className="w-4 h-4" /> {t('simulation.copyNode')}
          </button>
        ) : (
          <>
            <button onClick={() => copyToClipboard(`${contextMenu.sourceCcs} -${contextMenu.action}-> ${contextMenu.targetCcs}`)} 
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2">
              <Copy className="w-4 h-4" /> {t('simulation.copyEdge')}
            </button>
            {onCreateProofCard && (
              <button onClick={() => {
                onCreateProofCard(contextMenu.sourceCcs!, contextMenu.targetCcs!, contextMenu.action!);
                toast.success(t('simulation.sosCreated'), { duration: 10000 });
                setContextMenu(null);
              }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex items-center gap-2 text-primary">
                <PlusCircle className="w-4 h-4" /> {t('simulation.createSosProof')}
              </button>
            )}
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden" ref={containerRef}>

      <div className="absolute top-0 right-0 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="bg-stone-100/50 backdrop-blur-sm shadow-sm hover:bg-stone-50 cursor-pointer" aria-label={t('core.downloadAs')}>
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport(cyRef.current, 'png')}>
              {t('core.exportAs', { name: 'PNG'})}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(cyRef.current, 'svg')}>
              {t('core.exportAs', { name: 'SVG'})}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport(cyRef.current, 'json')}>
              {t('core.exportAs', { name: 'JSON'})}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CytoscapeComponent
        elements={elements ?? []}
        style={{ width: '100%', height: '100%' }}
        stylesheet={stylesheet}
        cy={(cy) => { cyRef.current = cy; }}
        pixelRatio={1.5}
      />

      {renderTooltip()}
      {renderContextMenu()}
    </div>
  );
}