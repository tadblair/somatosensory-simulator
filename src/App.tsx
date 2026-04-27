import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Hand, 
  IceCream, 
  Weight, 
  Info, 
  Activity,
  ArrowRight,
  Brain,
  Shield,
  Layers,
  Circle
} from 'lucide-react';

// --- Types ---

type Limb = 'left-arm' | 'right-arm' | 'left-leg' | 'right-leg';
type StimulusType = 'needle' | 'ice' | 'load';

interface PathwayPulse {
  id: string;
  pathId: string;
  path: string;
  color: string;
  duration: number;
  label: string;
  type: 'touch' | 'proprio' | 'pain';
}

// --- Constants & Data ---

const LIMBS: { id: Limb; label: string; buttonLabel: string; x: number; y: number }[] = [
  { id: 'left-arm', label: 'ARM SKIN', buttonLabel: 'LEFT ARM', x: 216, y: 614 },
  { id: 'right-arm', label: 'ARM SKIN', buttonLabel: 'RIGHT ARM', x: 784, y: 614 },
  { id: 'left-leg', label: 'LEG SKIN', buttonLabel: 'LEFT LEG', x: 216, y: 902 },
  { id: 'right-leg', label: 'LEG SKIN', buttonLabel: 'RIGHT LEG', x: 784, y: 902 },
];

const COLORS = {
  touch: '#2563eb', // blue
  proprio: '#059669', // green
  pain: '#d97706', // amber
  background_line: '#f1f5f9',
};

const DURATIONS = {
  alpha: 0.8,   // A-alpha (Proprioception)
  beta: 1.5,    // A-beta (Touch)
  delta: 4.0,   // A-delta (Fast pain / Cold)
  c: 8.0,       // C-fiber (Slow pain)
  reflex: 0.5,  // Local reflex arc
};

// --- Node Position Definitions ---
// Coordinates based on a 1000x1000 viewbox

const NODES = {
  // S1 Cortex (L/R)
  S1L: { x: 376.67, y: 60, label: 'S1 Cortex', labelPos: 'left' as const },
  S1R: { x: 623.33, y: 60, label: '', labelPos: 'right' as const },
  
  // Thalamus (L/R)
  ThalamusL: { x: 376.67, y: 118, label: 'Thalamus (VPL)', labelPos: 'left' as const },
  ThalamusR: { x: 623.33, y: 118, label: '', labelPos: 'right' as const },
  
  // Midbrain / Brainstem
  PAG: { x: 500, y: 250, label: 'PAG', labelPos: 'top' as const },
  CerebellumL: { x: 376.67, y: 200, label: 'Cerebellum', labelPos: 'left' as const },
  CerebellumR: { x: 623.33, y: 200, label: '', labelPos: 'right' as const },
  MedullaL: { x: 476, y: 300, label: 'Medulla', labelPos: 'left' as const },
  MedullaR: { x: 524, y: 300, label: '', labelPos: 'right' as const },
  
  // Spinal Cord Nodes (Dorsal Horn L/R)
  SpineCervicalL: { x: 444, y: 608, label: '', labelPos: 'top' as const },
  SpineCervicalR: { x: 556, y: 608, label: '', labelPos: 'top' as const },
  SpineLumbarL: { x: 444, y: 896, label: '', labelPos: 'top' as const },
  SpineLumbarR: { x: 556, y: 896, label: '', labelPos: 'top' as const },
  
  // Ventral Horn Nodes (L/R)
  VHORN_CervL: { x: 460, y: 576, label: '', labelPos: 'left' as const },
  VHORN_CervR: { x: 540, y: 576, label: '', labelPos: 'right' as const },
  VHORN_LumL: { x: 460, y: 864, label: '', labelPos: 'left' as const },
  VHORN_LumR: { x: 540, y: 864, label: '', labelPos: 'right' as const },
  
  // Local Muscle Targets (Lateral to sources)
  MuscleLA: { x: 168, y: 566, label: 'ARM MUSCLE', labelPos: 'top' as const },
  MuscleRA: { x: 832, y: 566, label: 'ARM MUSCLE', labelPos: 'top' as const },
  MuscleLL: { x: 168, y: 854, label: 'LEG MUSCLE', labelPos: 'top' as const },
  MuscleRL: { x: 832, y: 854, label: 'LEG MUSCLE', labelPos: 'top' as const },

  // DRG Nodes (Triplets: Pain upper, Touch mid, Prop lower)
  DRG_CervL_Pain: { x: 318, y: 637.33 - 16, label: '', labelPos: 'bottom' as const, color: '#f59e0b' },
  DRG_CervR_Pain: { x: 682, y: 637.33 - 16, label: '', labelPos: 'bottom' as const, color: '#f59e0b' },
  DRG_LumL_Pain: { x: 318, y: 925.33 - 16, label: '', labelPos: 'bottom' as const, color: '#f59e0b' },
  DRG_LumR_Pain: { x: 682, y: 925.33 - 16, label: '', labelPos: 'bottom' as const, color: '#f59e0b' },

  DRG_CervL_Touch: { x: 318, y: 637.33, label: '', labelPos: 'bottom' as const, color: '#3b82f6' },
  DRG_CervR_Touch: { x: 682, y: 637.33, label: '', labelPos: 'bottom' as const, color: '#3b82f6' },
  DRG_LumL_Touch: { x: 318, y: 925.33, label: '', labelPos: 'bottom' as const, color: '#3b82f6' },
  DRG_LumR_Touch: { x: 682, y: 925.33, label: '', labelPos: 'bottom' as const, color: '#3b82f6' },

  DRG_CervL_Prop: { x: 318, y: 637.33 + 16, label: '', labelPos: 'bottom' as const, color: '#10b981' },
  DRG_CervR_Prop: { x: 682, y: 637.33 + 16, label: '', labelPos: 'bottom' as const, color: '#10b981' },
  DRG_LumL_Prop: { x: 318, y: 925.33 + 16, label: '', labelPos: 'bottom' as const, color: '#10b981' },
  DRG_LumR_Prop: { x: 682, y: 925.33 + 16, label: '', labelPos: 'bottom' as const, color: '#10b981' },
};

// Helper for generating path data
const p = (...pts: {x: number, y: number}[]) => {
  if (pts.length === 0) return '';
  return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ');
};

const getButterflyPath = (cx: number, cy: number) => {
  // This creates a stylized "H" or butterfly shape for spinal gray matter.
  return `
    M ${cx - 16} ${cy + 0} 
    L ${cx + 16} ${cy + 0}
    L ${cx + 44} ${cy - 30} 
    Q ${cx + 74} ${cy - 30} ${cx + 78} ${cy - 8}
    Q ${cx + 64} ${cy + 8} ${cx + 84} ${cy + 30}
    Q ${cx + 80} ${cy + 46} ${cx + 44} ${cy + 42}
    L ${cx + 16} ${cy + 12}
    L ${cx - 16} ${cy + 12}
    L ${cx - 44} ${cy + 42}
    Q ${cx - 80} ${cy + 46} ${cx - 84} ${cy + 30}
    Q ${cx - 64} ${cy + 8} ${cx - 78} ${cy - 8}
    Q ${cx - 74} ${cy - 30} ${cx - 44} ${cy - 30}
    Z
  `.replace(/\s+/g, ' ').trim();
};

export default function App() {
  const [activePulses, setActivePulses] = useState<PathwayPulse[]>([]);
  const [activeLimb, setActiveLimb] = useState<Limb | null>(null);
  const [activeFlashes, setActiveFlashes] = useState<Record<string, string>>({});
  const [injuryType, setInjuryType] = useState<'none' | 'nerve' | 'spine'>('none');
  const [injuryLevel, setInjuryLevel] = useState<'C2' | 'C7' | 'L2' | 'L4'>('C7');
  const [injurySide, setInjurySide] = useState<'left' | 'right' | 'bilat'>('left');

  const flashNode = useCallback((nodeId: string, color: string) => {
    setActiveFlashes(prev => ({ ...prev, [nodeId]: color }));
    setTimeout(() => {
      setActiveFlashes(prev => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
    }, 400);
  }, []);

  const isInjured = useCallback((limbId: Limb) => {
    if (injuryType !== 'nerve') return false;
    const isArm = limbId.includes('arm');
    const isLeft = limbId.includes('left');
    const sideMatch = injurySide === 'bilat' || (isLeft && injurySide === 'left') || (!isLeft && injurySide === 'right');
    const levelMatch = (isArm && injuryLevel === 'C7') || (!isArm && injuryLevel === 'L4');
    return sideMatch && levelMatch;
  }, [injuryType, injuryLevel, injurySide]);

  const getPathPoints = useCallback((pathId: string, forVisualOnly = false): { x: number; y: number }[] => {
    const parts = pathId.split('-');
    const limbId = `${parts[0]}-${parts[1]}` as Limb;
    const type = parts[2];
    const subType = parts[3];

    const isArm = limbId.includes('arm');
    const isLeft = limbId.includes('left');
    const isGreen = type.startsWith('prop') || type === 'stretch' || type === 'spinocerebellar';
    const limbData = LIMBS.find(l => l.id === limbId)!;
    const muscle = isArm 
      ? (isLeft ? NODES.MuscleLA : NODES.MuscleRA) 
      : (isLeft ? NODES.MuscleLL : NODES.MuscleRL);
    
    // Origin mapping
    const origin = isGreen ? muscle : { x: limbData.x, y: limbData.y };
    
    // Entry spine node (DHORN)
    const spineNode = isArm 
      ? (isLeft ? NODES.SpineCervicalL : NODES.SpineCervicalR) 
      : (isLeft ? NODES.SpineLumbarL : NODES.SpineLumbarR);

    // Motor output node (VHORN)
    const vhornNode = isArm
      ? (isLeft ? NODES.VHORN_CervL : NODES.VHORN_CervR)
      : (isLeft ? NODES.VHORN_LumL : NODES.VHORN_LumR);

    // DRG Selection
    const drgNode = type.startsWith('pain') || type === 'withdrawal'
      ? (isArm ? (isLeft ? NODES.DRG_CervL_Pain : NODES.DRG_CervR_Pain) : (isLeft ? NODES.DRG_LumL_Pain : NODES.DRG_LumR_Pain))
      : type.startsWith('prop') || type === 'stretch' || type === 'spinocerebellar'
      ? (isArm ? (isLeft ? NODES.DRG_CervL_Prop : NODES.DRG_CervR_Prop) : (isLeft ? NODES.DRG_LumL_Prop : NODES.DRG_LumR_Prop))
      : (isArm ? (isLeft ? NODES.DRG_CervL_Touch : NODES.DRG_CervR_Touch) : (isLeft ? NODES.DRG_LumL_Touch : NODES.DRG_LumR_Touch));

    const getRawPoints = (): { x: number; y: number }[] => {
      switch(type) {
        case 'touch':
        case 'prop':
        case 'propentry':
        case 'propdcml': {
          const targetS1 = isLeft ? NODES.S1R : NODES.S1L;
          const targetThal = isLeft ? NODES.ThalamusR : NODES.ThalamusL;
          const ipsiMedulla = isLeft ? NODES.MedullaL : NODES.MedullaR;
          
          const isTouch = type === 'touch';
          const dcmlOffset = isTouch ? (isArm ? 36 : 44) : (isArm ? 40 : 48);
          const medialX = isLeft ? spineNode.x + dcmlOffset : spineNode.x - dcmlOffset;
          const bend1 = { x: medialX, y: spineNode.y + 16 };
          const bend2 = { x: medialX, y: ipsiMedulla.y + 160 };
          const crossPoint = { x: isLeft ? NODES.MedullaR.x : NODES.MedullaL.x, y: ipsiMedulla.y - 20 };

          const startPathPeripheral = isTouch 
            ? [origin, drgNode]
            : [origin, { x: origin.x, y: drgNode.y }, drgNode];

          if (type === 'propentry' || subType === 'peripheral') return startPathPeripheral;
          
          const entrySegment = [drgNode, bend1];
          const ascendingSegment = [bend1, bend2, ipsiMedulla, crossPoint, targetThal, targetS1];

          if (subType === 'entry') return entrySegment;
          if (subType === 'ascending') return ascendingSegment;

          // Fallback for full background paths
          if (type === 'propdcml') {
            return [drgNode, bend1, bend2, ipsiMedulla, crossPoint, targetThal, targetS1];
          }

          return [
            ...startPathPeripheral,
            bend1,
            bend2,
            ipsiMedulla,
            crossPoint,
            targetThal,
            targetS1
          ];
        }

        case 'propsc':
        case 'propsc_trunk':
        case 'propsc_ipsi':
        case 'propsc_contra':
        case 'spinocerebellar': {
          const targetCerebellum = isLeft ? NODES.CerebellumL : NODES.CerebellumR;
          const otherCerebellum = isLeft ? NODES.CerebellumR : NODES.CerebellumL;
          const scX = isArm ? (isLeft ? targetCerebellum.x + 8 : targetCerebellum.x - 8) : targetCerebellum.x;
          const startPath = [origin, { x: origin.x, y: drgNode.y }, drgNode];
          const branchPoint = { x: scX, y: 232 }; // 32 units (1 grid sq) below cerebellum (y=200)
          
          if (type === 'propsc_trunk') return [drgNode, spineNode, { x: scX, y: spineNode.y - 16 }, branchPoint];
          if (type === 'propsc_ipsi') return [branchPoint, targetCerebellum];
          if (type === 'propsc_contra') return [branchPoint, otherCerebellum];
          
          return [...startPath, spineNode, { x: scX, y: spineNode.y - 16 }, branchPoint, targetCerebellum];
        }
        
        case 'withdrawal':
        case 'stretch': {
          const isStretch = type === 'stretch';
          const startPath = isStretch
            ? [origin, { x: origin.x, y: drgNode.y }, drgNode]
            : [origin, drgNode];

          const drgX = isLeft ? 318 : 682;
          const bendY = vhornNode.y - 36;
          const vhornBend = { x: drgX, y: bendY };

          if (subType === 'sensory') return [...startPath, spineNode];
          if (subType === 'motor') return [spineNode, vhornNode, vhornBend, muscle];
          
          return [...startPath, spineNode, vhornNode, vhornBend, muscle];
        }

        case 'pain':
        case 'painentry':
        case 'painascending':
        case 'painvpl':
        case 'painpag': {
          const entryPathPain = [origin, drgNode, spineNode];
          const p1 = { x: isLeft ? 516 : 484, y: spineNode.y - 58.67 };
          const sttOffset = isArm ? 88 : 96;
          const p2 = { x: isLeft ? 500 + sttOffset : 500 - sttOffset, y: spineNode.y - 32 };
          const p_fork = { x: isLeft ? 500 + sttOffset : 500 - sttOffset, y: NODES.PAG.y + 32 };
          const targetS1 = isLeft ? NODES.S1R : NODES.S1L;
          const targetThal = isLeft ? NODES.ThalamusR : NODES.ThalamusL;

          if (type === 'painentry') return entryPathPain;
          if (type === 'painascending') return [spineNode, p1, p2, p_fork];
          if (type === 'painvpl') return [p_fork, targetThal, targetS1];
          if (type === 'painpag') return [p_fork, NODES.PAG];

          return subType === 'stt' 
            ? [...entryPathPain, p1, p2, p_fork, targetThal, targetS1]
            : [...entryPathPain, p1, p2, p_fork, NODES.PAG];
        }

        default: return [];
      }
    };

    const raw = getRawPoints();
    
    // NERVE INJURY LOGIC
    if (injuryType === 'nerve' && isInjured(limbId)) {
      if (subType === 'entry' || subType === 'propdcml-entry' || subType === 'touch-entry') return [];

      const drgIndex = raw.findIndex(pt => pt.x === drgNode.x && pt.y === drgNode.y);
      const spineIndex = raw.findIndex(pt => pt.x === spineNode.x && pt.y === spineNode.y);

      // Truncate segment DRG -> Spine for nerve injury
      if (drgIndex !== -1 && spineIndex !== -1 && spineIndex > drgIndex) {
        if (type === 'propsc_trunk') {
          return raw.slice(spineIndex);
        }
        return raw.slice(0, drgIndex + 1);
      }
    }

    // SPINE INJURY LOGIC - Truncate only for PULSES, not for visual lines
    if (injuryType === 'spine' && !forVisualOnly) {
      const isAnterolateral = type.includes('pain');
      const isSpinocerebellar = type.includes('propsc') || type.includes('spinocerebellar');
      const isDorsalColumn = type.includes('touch') || type.includes('propdcml');
      const isLegSignal = limbId.includes('leg');

      // Define block level and midpoint
      let blockY = 448; // C2 midpoint (default)
      if (injuryLevel === 'C7') blockY = 592.53;
      if (injuryLevel === 'L2') blockY = 736.53;
      if (injuryLevel === 'L4') blockY = 880.53;

      // Logic:
      // C2/C7: Block AL/SC on injured side. Block DCML if BILAT.
      // L4/L2: Block AL/SC for LEG ONLY on injured side. DCML for LEG ONLY if BILAT.
      const isRelevantLevel = injuryLevel === 'C2' || 
                              injuryLevel === 'C7' || 
                              ((injuryLevel === 'L4' || injuryLevel === 'L2') && isLegSignal);

      let effectiveShouldBlockALSC = (isAnterolateral || isSpinocerebellar) && isRelevantLevel;
      let effectiveShouldBlockDCML = isDorsalColumn && injurySide === 'bilat' && isRelevantLevel;
      let forceBlockBothSides = false;

      // Special refinement for unilateral injuries at C7 and L4/L2
      if (injurySide !== 'bilat' && isAnterolateral) {
        if (injuryLevel === 'C7') {
          if (isLegSignal) {
            forceBlockBothSides = true; // Block both leg nociceptive pathways at C7
          } else {
            effectiveShouldBlockALSC = false; // Permit contralateral arm AL track
          }
        } else if (injuryLevel === 'L4' || injuryLevel === 'L2') {
          effectiveShouldBlockALSC = false; // Permit contralateral leg nociceptive pathway
        }
      }

      if (effectiveShouldBlockALSC || effectiveShouldBlockDCML) {
        const newPoints: { x: number; y: number }[] = [];
        for (let i = 0; i < raw.length; i++) {
          const pt = raw[i];
          const isPointOnInjuredSide = forceBlockBothSides || injurySide === 'bilat' || (injurySide === 'left' ? pt.x < 500 : pt.x > 500);
          
          if (isPointOnInjuredSide && pt.y <= blockY) {
             // Terminate at blockY if crossing from below
             if (i > 0 && raw[i-1].y > blockY) {
                const prev = raw[i-1];
                const t = (blockY - prev.y) / (pt.y - prev.y);
                const blockX = prev.x + t * (pt.x - prev.x);
                newPoints.push({ x: blockX, y: blockY });
                return newPoints;
             }
             
             // If crossing midline above blockY, don't block (Only for unilateral injury)
             if (injurySide !== 'bilat' && i > 0) {
                const prev = raw[i-1];
                const wasOnInjuredSide = injurySide === 'left' ? prev.x < 500 : prev.x > 500;
                if (!wasOnInjuredSide) {
                   newPoints.push(pt);
                   continue;
                }
             }
             
             // Already on injured side and above blockY (and didn't just cross midline)
             // This might be the first point of a brainstem-only segment
             if (i === 0) {
                newPoints.push(pt);
                continue;
             }

             return newPoints;
          }
          newPoints.push(pt);
        }
        return newPoints;
      }
    }

    return raw;
  }, [isInjured, injuryType, injuryLevel, injurySide]);


  const getPathData = useCallback((pathId: string) => {
    return p(...getPathPoints(pathId, true));
  }, [getPathPoints]);

  // List of all possible path IDs to render as background
  const ALL_PATHS = useMemo(() => {
    const paths: string[] = [];
    LIMBS.forEach(limb => {
      paths.push(`${limb.id}-touch-peripheral`);
      paths.push(`${limb.id}-touch-entry`);
      paths.push(`${limb.id}-touch-ascending`);
      paths.push(`${limb.id}-withdrawal-sensory`);
      paths.push(`${limb.id}-withdrawal-motor`);
      paths.push(`${limb.id}-painentry`);
      paths.push(`${limb.id}-painascending`);
      paths.push(`${limb.id}-painvpl`);
      paths.push(`${limb.id}-painpag`);
      paths.push(`${limb.id}-propentry`);
      paths.push(`${limb.id}-propdcml-entry`);
      paths.push(`${limb.id}-propdcml-ascending`);
      paths.push(`${limb.id}-propsc_trunk`);
      paths.push(`${limb.id}-propsc_ipsi`);
      paths.push(`${limb.id}-propsc_contra`);
      paths.push(`${limb.id}-stretch-sensory`);
      paths.push(`${limb.id}-stretch-motor`);
    });
    return paths;
  }, []);

  const triggerPulse = useCallback((
    pathId: string, 
    type: 'touch' | 'proprio' | 'pain', 
    duration: number, 
    label: string,
    color: string,
    onComplete?: () => void
  ) => {
    const pts = getPathPoints(pathId);
    if (pts.length < 2) {
      if (onComplete) onComplete();
      return;
    }

    // Sequence through points
    let currentPointIndex = 0;
    
    const animateSegment = () => {
      if (currentPointIndex >= pts.length - 1) {
        if (onComplete) onComplete();
        return;
      }

      const p1 = pts[currentPointIndex];
      const p2 = pts[currentPointIndex + 1];
      const segmentId = Math.random().toString(36).substring(7);
      
      // Flash node at start of segment if it's a known node
      const findNodeAt = (x: number, y: number) => {
        return Object.entries(NODES).find(([, n]) => Math.abs(n.x - x) < 1 && Math.abs(n.y - y) < 1)?.[0];
      };
      const findLimbAt = (x: number, y: number) => {
        return LIMBS.find(l => Math.abs(l.x - x) < 1 && Math.abs(l.y - y) < 1)?.id;
      };

      const startNodeId = findNodeAt(p1.x, p1.y);
      const startLimbId = findLimbAt(p1.x, p1.y);
      if (startNodeId) flashNode(startNodeId, color);
      if (startLimbId) flashNode(startLimbId, color);

      // Duration for this segment based on total duration and point count
      // Simple uniform distribution for simplicity, but could be distance-weighted
      const segmentDuration = duration / (pts.length - 1);

      const segmentPathId = `seg-${segmentId}`;
      const segmentPath = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      const pulse: PathwayPulse = {
        id: segmentId,
        pathId: segmentPathId,
        path: segmentPath,
        type,
        duration: segmentDuration,
        label,
        color
      };
      
      setActivePulses(prev => [...prev, pulse]);

      setTimeout(() => {
        setActivePulses(prev => prev.filter(p => p.id !== segmentId));
        
        // Final node flash
        if (currentPointIndex === pts.length - 2) {
          const endNodeId = findNodeAt(p2.x, p2.y);
          const endLimbId = findLimbAt(p2.x, p2.y);
          if (endNodeId) flashNode(endNodeId, color);
          if (endLimbId) flashNode(endLimbId, color);
        }

        currentPointIndex++;
        animateSegment();
      }, segmentDuration * 1000);
    };

    animateSegment();
  }, [getPathPoints, flashNode]);

  const handleStimulus = (limb: Limb, stimulus: StimulusType | 'withdrawal' | 'stretch') => {
    setActiveLimb(limb);
    const injured = isInjured(limb);

    const checkSpineBlock = (pathId: string) => {
      const pts = getPathPoints(pathId);
      if (pts.length === 0) return false;
      const last = pts[pts.length - 1];

      let blockY = 448;
      if (injuryLevel === 'C7') blockY = 592.53;
      if (injuryLevel === 'L2') blockY = 736.53;
      if (injuryLevel === 'L4') blockY = 880.53;

      // If the path was truncated at currently selected spinal level midpoint
      const isBlocked = Math.abs(last.y - blockY) < 1;
      return isBlocked;
    };

    if (stimulus === 'needle') {
      // DORSAL COLUMN: Peripheral -> Entry -> Ascending
      triggerPulse(`${limb}-touch-peripheral`, 'touch', DURATIONS.beta * 0.2, 'Touch: Peripheral', COLORS.touch, () => {
        if (!injured) {
          triggerPulse(`${limb}-touch-entry`, 'touch', DURATIONS.beta * 0.1, 'Touch: DRG Entry', COLORS.touch, () => {
             const isBlocked = checkSpineBlock(`${limb}-touch-ascending`);
             triggerPulse(`${limb}-touch-ascending`, 'touch', DURATIONS.beta * 0.7, 'Dorsal Column: Thalamus/S1', COLORS.touch, () => {
                // If we had a next stage, we'd check !isBlocked here
             });
          });
        }
      });
    } else if (stimulus === 'ice') {
      // NOCICEPTION: Slow entry (C-fibers) then fast ascending (second-order)
      const entryDuration = 2.5; 
      const ascendingDuration = 1.0; 
      const branchVPL = 0.4;
      const branchPAG = 0.2;
      
      triggerPulse(`${limb}-painentry`, 'pain', entryDuration, 'C-fiber: Peripheral', COLORS.pain, () => {
        if (!injured) {
          const isBlocked = checkSpineBlock(`${limb}-painascending`);
          triggerPulse(`${limb}-painascending`, 'pain', ascendingDuration, 'STT: Fast Ascending', COLORS.pain, () => {
            if (!isBlocked) {
              triggerPulse(`${limb}-painvpl`, 'pain', branchVPL, 'STT: VPL/S1', COLORS.pain);
              triggerPulse(`${limb}-painpag`, 'pain', branchPAG, 'STT: PAG', COLORS.pain);
            }
          });
        }
      });
    } else if (stimulus === 'load') {
      // PROPRIOCEPTION: Muscle to DRG, then bifurcate to SC and DCML
      const entryDuration = 0.4;
      const ascendingDuration = 1.2;
      
      triggerPulse(`${limb}-propentry`, 'proprio', entryDuration, 'A-alpha: Peripheral', COLORS.proprio, () => {
        if (!injured) {
          // Bifurcate DCML and SC Trunk
          triggerPulse(`${limb}-propdcml-entry`, 'proprio', ascendingDuration * 0.1, 'Proprio Entry', COLORS.proprio, () => {
             const isBlocked = checkSpineBlock(`${limb}-propdcml-ascending`);
             triggerPulse(`${limb}-propdcml-ascending`, 'proprio', ascendingDuration * 0.9, 'Proprio DCML', COLORS.proprio, () => {
                // Next stage check if needed
             });
          });
          
          const isBlocked = checkSpineBlock(`${limb}-propsc_trunk`);
          triggerPulse(`${limb}-propsc_trunk`, 'proprio', ascendingDuration * 0.7, 'Proprio: Ascending', COLORS.proprio, () => {
             if (!isBlocked) {
                // Bilateral bifurcation at SC branch point
                triggerPulse(`${limb}-propsc_ipsi`, 'proprio', ascendingDuration * 0.15, 'Ipsi Cerebellum', COLORS.proprio);
                triggerPulse(`${limb}-propsc_contra`, 'proprio', ascendingDuration * 0.2, 'Contra Cerebellum', COLORS.proprio);
             }
          });
        }
      });
    } else if (stimulus === 'withdrawal') {
      // Withdrawal Reflex: Skin -> DRG -> DHORN -> VHORN -> Muscle (Blue)
      triggerPulse(`${limb}-withdrawal-sensory`, 'touch', DURATIONS.beta * 0.25, 'Withdrawal: Sensory', COLORS.touch, () => {
        if (!injured) {
          triggerPulse(`${limb}-withdrawal-motor`, 'touch', DURATIONS.beta * 0.25, 'Withdrawal: Motor', COLORS.touch);
        }
      });
    } else if (stimulus === 'stretch') {
      // Stretch Reflex: Muscle -> DRG -> DHORN -> VHORN -> Muscle (Green)
      triggerPulse(`${limb}-stretch-sensory`, 'proprio', DURATIONS.alpha * 0.25, 'Stretch: Sensory', COLORS.proprio, () => {
        if (!injured) {
          triggerPulse(`${limb}-stretch-motor`, 'proprio', DURATIONS.alpha * 0.25, 'Stretch: Motor', COLORS.proprio);
        }
      });
    }
  };

  return (
    <div className="w-full h-screen bg-slate-50 text-slate-900 flex font-sans overflow-hidden border-4 border-slate-200">
      
      {/* Sidebar Controls */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-4 shadow-sm z-20">
        <div>
          <header className="flex flex-col mb-2">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Activity className="w-5 h-5" />
              <h1 className="text-xl font-bold text-slate-800 leading-tight uppercase tracking-wider">Somatosensory<br/>Explorer</h1>
            </div>
            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
          </header>
        </div>

        <section className="space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">1. Select Source</p>
          <div className="grid grid-cols-2 gap-2">
            {LIMBS.map(limb => (
              <button 
                key={limb.id}
                onClick={() => setActiveLimb(limb.id)}
                className={`px-2 py-1.5 border-2 transition-all text-xs font-bold rounded flex items-center justify-center leading-tight ${
                  activeLimb === limb.id 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'
                }`}
              >
                <span>{limb.buttonLabel.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">2. Stimulate Pathway</p>
          <div className="space-y-2">
            <button 
              disabled={!activeLimb}
              onClick={() => activeLimb && handleStimulus(activeLimb, 'needle')}
              className="w-full p-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg flex items-center justify-between hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-bold">DISCRIMINATIVE TOUCH</span>
                <span className="text-[10px] text-slate-500 uppercase">DORSAL COLUMN</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </button>

            <button 
              disabled={!activeLimb}
              onClick={() => activeLimb && handleStimulus(activeLimb, 'ice')}
              className="w-full p-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg flex items-center justify-between hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-bold">NOCICEPTION</span>
                <span className="text-[10px] text-slate-500 uppercase">ANTEROLATERAL PATHWAY</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            </button>

            <button 
              disabled={!activeLimb}
              onClick={() => activeLimb && handleStimulus(activeLimb, 'load')}
              className="w-full p-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg flex items-center justify-between hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-bold">PROPRIOCEPTION</span>
                <span className="text-[10px] text-slate-500 uppercase">DORSAL COLUMN + SPINOCEREBELLAR</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </button>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button 
                disabled={!activeLimb}
                onClick={() => activeLimb && handleStimulus(activeLimb, 'withdrawal')}
                className="w-full p-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg flex items-center justify-between hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-bold">WITHDRAWAL REFLEX</span>
                  <span className="text-[10px] text-slate-500 uppercase">SPINAL PATHWAY</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.5)]" />
              </button>

              <button 
                disabled={!activeLimb}
                onClick={() => activeLimb && handleStimulus(activeLimb, 'stretch')}
                className="w-full p-1.5 bg-white border border-slate-200 text-slate-800 rounded-lg flex items-center justify-between hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-bold">STRETCH REFLEX</span>
                  <span className="text-[10px] text-slate-500 uppercase">SPINAL PATHWAY</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(167,243,208,0.5)]" />
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-relaxed">
            3. knife cut injury
          </p>
          
          <div className="space-y-3">
            {/* Injury Type */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['none', 'nerve', 'spine'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setInjuryType(type)}
                  className={`flex-1 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                    injuryType === type 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Injury Level */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['C2', 'C7', 'L2', 'L4'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setInjuryLevel(level)}
                  className={`flex-1 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                    injuryLevel === level 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Side */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['left', 'bilat', 'right'] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setInjurySide(side)}
                  className={`flex-1 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                    injurySide === side 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        </section>
      </aside>

      {/* Main Diagram Stage */}
      <main className="flex-1 relative bg-white flex items-center justify-center p-10 overflow-hidden">
        {/* Anatomical Labels Overlay */}
        <div className="absolute top-10 left-10 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] pointer-events-none select-none">
          Supraspinal Targets Mapping
        </div>

        <div className="w-full h-full max-w-[900px] max-h-[900px] border border-slate-100 rounded-2xl relative bg-white shadow-inner">
          <svg viewBox="0 0 1000 1000" className="w-full h-full">
            {/* Spinal Cord Section Ellipses */}
            <ellipse cx="500" cy="592.53" rx="150" ry="48" fill="none" stroke="#64748b" strokeWidth="2" />
            <path d={getButterflyPath(500, 584)} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="338" y="592.53" dy="6" textAnchor="end" className="fill-black text-sm font-black font-mono">C7</text>
            
            <ellipse cx="500" cy="880.53" rx="150" ry="48" fill="none" stroke="#64748b" strokeWidth="2" />
            <path d={getButterflyPath(500, 872)} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="338" y="880.53" dy="6" textAnchor="end" className="fill-black text-sm font-black font-mono">L4</text>

            {/* Shifted Copies with inner markers */}
            <ellipse cx="500" cy="448.53" rx="150" ry="48" fill="none" stroke="#64748b" strokeWidth="2" />
            <path d={getButterflyPath(500, 440)} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="408" cy="445.33" rx="12" ry="3.84" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <ellipse cx="592" cy="445.33" rx="12" ry="3.84" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <ellipse cx="376" cy="453.33" rx="12" ry="3.84" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            <ellipse cx="624" cy="453.33" rx="12" ry="3.84" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            <ellipse cx="487.2" cy="480.53" rx="12" ry="3.84" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            <ellipse cx="512.8" cy="480.53" rx="12" ry="3.84" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="338" y="448.53" dy="6" textAnchor="end" className="fill-black text-sm font-black font-mono">C2</text>

            <ellipse cx="500" cy="736.53" rx="150" ry="48" fill="none" stroke="#64748b" strokeWidth="2" />
            <path d={getButterflyPath(500, 728)} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <ellipse cx="404" cy="733.33" rx="12" ry="3.84" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <ellipse cx="596" cy="733.33" rx="12" ry="3.84" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
            <ellipse cx="372" cy="741.33" rx="12" ry="3.84" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            <ellipse cx="628" cy="741.33" rx="12" ry="3.84" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            <ellipse cx="487.2" cy="768.53" rx="12" ry="3.84" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            <ellipse cx="512.8" cy="768.53" rx="12" ry="3.84" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="338" y="736.53" dy="6" textAnchor="end" className="fill-black text-sm font-black font-mono">L2</text>

            {/* Spine Injury Visual Indicator */}
            {injuryType === 'spine' && (
              <g>
                {(() => {
                  const y = injuryLevel === 'C7' ? 592.53 : injuryLevel === 'C2' ? 448.53 : injuryLevel === 'L4' ? 880.53 : 736.53;
                  const ry = 48;
                  const rx = 150;
                  const cx = 500;
                  
                  // Shade lateral part, halfway to midline (rx/2 = 75)
                  const rectWidth = injurySide === 'bilat' ? rx * 2 : 75;
                  const rectX = injurySide === 'bilat' ? cx - rx : (injurySide === 'left' ? cx - rx : cx + rx - rectWidth);
                  
                  return (
                    <g>
                      <defs>
                        <clipPath id={`spine-clip-${injuryLevel}`}>
                          <ellipse cx={cx} cy={y} rx={rx} ry={ry} />
                        </clipPath>
                      </defs>
                      <motion.rect
                        x={rectX}
                        y={y - ry}
                        width={rectWidth}
                        height={ry * 2}
                        fill="#334155"
                        fillOpacity="0.8"
                        clipPath={`url(#spine-clip-${injuryLevel})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={`${injuryLevel}-${injurySide}`}
                      />
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Ventral/Dorsal labels for L2 */}
            <text x="500" y="680.53" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold uppercase tracking-widest">VENTRAL</text>
            <text x="500" y="796.53" textAnchor="middle" className="fill-slate-500 text-[10px] font-bold uppercase tracking-widest">DORSAL</text>
            
            {/* Side Labels */}
            <text x="318" y="332" textAnchor="middle" className="fill-slate-400 text-sm font-black uppercase tracking-widest">LEFT SIDE</text>
            <text x="682" y="332" textAnchor="middle" className="fill-slate-400 text-sm font-black uppercase tracking-widest">RIGHT SIDE</text>
            
            {/* 1. Background Paths (Static) */}
            <g opacity="0.5">
              {ALL_PATHS.map(pathId => {
                const type = pathId.split('-')[2];
                let color = '#475569'; // default slate
                if (type.startsWith('touch')) color = COLORS.touch;
                else if (type.startsWith('prop') || type === 'stretch' || type === 'spinocerebellar') color = COLORS.proprio;
                else if (type.startsWith('pain') || type === 'withdrawal') color = COLORS.pain;
                
                return (
                  <path 
                    key={`bg-${pathId}`} 
                    d={getPathData(pathId)} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="1.5" 
                  />
                );
              })}
            </g>

            {/* 2. Active Pathway Glow & Pulses */}
            {activePulses.map(pulse => (
              <g key={pulse.id}>
                {/* Glow Trace */}
                <motion.path
                  d={pulse.path}
                  fill="none"
                  stroke={pulse.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.6, 0] }}
                  transition={{ duration: pulse.duration, ease: "linear" }}
                />
                {/* Moving Action Potential */}
                <motion.circle
                  r="9"
                  fill={pulse.color}
                  style={{ filter: `drop-shadow(0 0 12px ${pulse.color})` }}
                >
                  <animateMotion
                    dur={`${pulse.duration}s`}
                    repeatCount="1"
                    path={pulse.path}
                  />
                </motion.circle>
              </g>
            ))}

            {/* 3. Anatomical Nodes */}
            {Object.entries(NODES).map(([id, pos]) => (
              <g key={id}>
                {id.startsWith('Muscle') && (
                  <g>
                    {/* Muscle Fibers */}
                    {[-6, -2, 2, 6].map((dy, i) => (
                      <line 
                        key={i}
                        x1={pos.x - 22} 
                        y1={pos.y + dy} 
                        x2={pos.x + 22} 
                        y2={pos.y + dy} 
                        stroke="#ef4444" 
                        strokeWidth="1.5" 
                      />
                    ))}
                  </g>
                )}
                <motion.circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="7" 
                  className={`stroke-[1.5px] stroke-black shadow-sm`}
                  animate={{
                    scale: activeFlashes[id] ? 1.5 : 1,
                    fill: activeFlashes[id] || (pos as any).color || (id.startsWith('S1') ? '#1e293b' : '#ffffff'),
                    strokeWidth: activeFlashes[id] ? 3 : 1.5
                  }}
                  transition={{ 
                    scale: { type: "spring", stiffness: 300, damping: 20 },
                    fill: { duration: 0.2 }
                  }}
                />
                
                <text 
                  x={pos.labelPos === 'left' ? pos.x - 14 : pos.labelPos === 'right' ? pos.x + 14 : pos.x}
                  y={pos.labelPos === 'top' ? pos.y - 14 : pos.y + 4}
                  textAnchor={pos.labelPos === 'left' ? 'end' : pos.labelPos === 'right' ? 'start' : 'middle'}
                  className={`text-[10px] font-bold uppercase tracking-tighter select-none pointer-events-none ${
                    (id === 'MuscleLA' && activeLimb === 'left-arm') ||
                    (id === 'MuscleRA' && activeLimb === 'right-arm') ||
                    (id === 'MuscleLL' && activeLimb === 'left-leg') ||
                    (id === 'MuscleRL' && activeLimb === 'right-leg')
                      ? 'fill-blue-700'
                      : 'fill-slate-600'
                  }`}
                >
                  {pos.label.split('\n').map((line, i) => (
                    <tspan key={i} x={pos.labelPos === 'left' ? pos.x - 14 : pos.labelPos === 'right' ? pos.x + 14 : pos.x} dy={i === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            ))}

            {/* DRG Group Labels */}
            {[
              { x: 318, y: 637.33, id: 'drg-cerv-l' },
              { x: 682, y: 637.33, id: 'drg-cerv-r' },
              { x: 318, y: 925.33, id: 'drg-lum-l' },
              { x: 682, y: 925.33, id: 'drg-lum-r' }
            ].map(group => (
              <text 
                key={group.id}
                x={group.x} 
                y={group.y + 42}
                textAnchor="middle" 
                className="fill-slate-400 text-[9px] font-bold uppercase tracking-widest leading-tight"
              >
                <tspan x={group.x} dy="0">DRG</tspan>
                <tspan x={group.x} dy="11">CELLS</tspan>
              </text>
            ))}

            {/* 4. Limb Sources */}
            {LIMBS.map(limb => (
              <g key={limb.id}>
                <motion.polygon 
                  points={`${limb.x},${limb.y - 12} ${limb.x + 22},${limb.y} ${limb.x},${limb.y + 12} ${limb.x - 22},${limb.y}`}
                  className="cursor-pointer stroke-[2px] stroke-black shadow-lg"
                  animate={{ 
                    fill: activeFlashes[limb.id] || '#af8a5b',
                    scale: activeFlashes[limb.id] ? 1.2 : 1
                  }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setActiveLimb(limb.id)}
                />
                <text 
                  x={limb.x} 
                  y={limb.y + 30} 
                  textAnchor="middle" 
                  className={`text-[11px] font-bold uppercase tracking-wider select-none pointer-events-none ${
                    activeLimb === limb.id ? 'fill-blue-700' : 'fill-slate-400'
                  }`}
                >
                  {limb.label}
                </text>
                {activeLimb === limb.id && (
                  <motion.polygon 
                    points={`${limb.x},${limb.y - 18} ${limb.x + 30},${limb.y} ${limb.x},${limb.y + 18} ${limb.x - 30},${limb.y}`}
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="1" 
                    className="opacity-20"
                    animate={{ scale: [1, 1.2], opacity: [0.2, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </g>
            ))}
          </svg>
        </div>
      </main>
    </div>
  );
}
