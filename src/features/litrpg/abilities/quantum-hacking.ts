// ============================================================
// QUANTUM / HACKING / HIGH-TECH INTERFACE ABILITIES
// Neural, hacking, prediction, code manipulation, advanced systems
// ============================================================

import { ExportedAbility } from './types';

export const QUANTUM_HACKING_ABILITIES: Record<string, ExportedAbility> = {
  'access-vector-analyzer': {
    id: 601,
    slug: 'access-vector-analyzer',
    name: 'Access Vector Analyzer',
    description: 'Security analysis system that identifies vulnerabilities in electronic systems.',
    maxLevel: 10,
    tiers: [
      { level: 1, duration: '20 sec', cooldown: '60 sec', effectDescription: 'Identify basic access points; hack speed +10%.' },
      { level: 2, duration: '25 sec', cooldown: '55 sec', effectDescription: 'Identify security cameras; hack speed +15%.' },
      { level: 3, duration: '30 sec', cooldown: '50 sec', effectDescription: 'Identify password complexity; hack speed +20%.' },
      { level: 4, duration: '35 sec', cooldown: '45 sec', effectDescription: 'Identify firewall types; hack speed +25%.' },
      { level: 5, duration: '40 sec', cooldown: '40 sec', effectDescription: 'Identify ICE programs; hack speed +30%.' },
      { level: 6, duration: '45 sec', cooldown: '35 sec', effectDescription: 'Identify admin access; hack speed +40%.' },
      { level: 7, duration: '50 sec', cooldown: '30 sec', effectDescription: 'Identify backdoors; hack speed +50%.' },
      { level: 8, duration: '55 sec', cooldown: '27 sec', effectDescription: 'Identify kill switches; hack speed +60%.' },
      { level: 9, duration: '60 sec', cooldown: '24 sec', effectDescription: 'Identify quantum encryption; hack speed +75%.' },
      { level: 10, duration: '90 sec', cooldown: '20 sec', effectDescription: 'Master Analyzer: See all vulnerabilities; instant hack any civilian system.' },
    ],
  },
  'system-breach-sequencer': {
    id: 602,
    slug: 'system-breach-sequencer',
    name: 'System Breach Sequencer',
    description: 'Automated intrusion protocol that systematically bypasses security layers.',
    maxLevel: 10,
    tiers: [
      { level: 1, duration: '15 sec', cooldown: '90 sec', effectDescription: 'Bypass 1 security layer.' },
      { level: 2, duration: '18 sec', cooldown: '85 sec', effectDescription: 'Bypass 2 security layers.' },
      { level: 3, duration: '21 sec', cooldown: '80 sec', effectDescription: 'Bypass 3 layers; disable alarms.' },
      { level: 4, duration: '24 sec', cooldown: '75 sec', effectDescription: 'Bypass 4 layers.' },
      { level: 5, duration: '27 sec', cooldown: '70 sec', effectDescription: 'Bypass 5 layers; create backdoor.' },
      { level: 6, duration: '30 sec', cooldown: '65 sec', effectDescription: 'Bypass 6 layers.' },
      { level: 7, duration: '35 sec', cooldown: '60 sec', effectDescription: 'Bypass military-grade security.' },
      { level: 8, duration: '40 sec', cooldown: '55 sec', effectDescription: 'Bypass corporate mainframes.' },
      { level: 9, duration: '45 sec', cooldown: '50 sec', effectDescription: 'Bypass quantum encryption.' },
      { level: 10, duration: '60 sec', cooldown: '40 sec', effectDescription: 'Master Breacher: Bypass any security; leave no trace.' },
    ],
  },
  'fortress-bypass-matrix': {
    id: 603,
    slug: 'fortress-bypass-matrix',
    name: 'Fortress Bypass Matrix',
    description: 'High-level intrusion system designed to penetrate the most secure facilities.',
    maxLevel: 10,
    tiers: [
      { level: 1, duration: '30 sec', cooldown: '120 sec', effectDescription: 'Bypass basic facility security.' },
      { level: 2, duration: '35 sec', cooldown: '110 sec', effectDescription: 'Bypass corporate facility security.' },
      { level: 3, duration: '40 sec', cooldown: '100 sec', effectDescription: 'Bypass military facility security.' },
      { level: 4, duration: '45 sec', cooldown: '90 sec', effectDescription: 'Bypass government facility security.' },
      { level: 5, duration: '50 sec', cooldown: '80 sec', effectDescription: 'Bypass black site security.' },
      { level: 6, duration: '55 sec', cooldown: '70 sec', effectDescription: 'Bypass AI-defended systems.' },
      { level: 7, duration: '60 sec', cooldown: '60 sec', effectDescription: 'Bypass quantum-locked facilities.' },
      { level: 8, duration: '70 sec', cooldown: '55 sec', effectDescription: 'Bypass orbital station security.' },
      { level: 9, duration: '80 sec', cooldown: '50 sec', effectDescription: 'Bypass any known security type.' },
      { level: 10, duration: '120 sec', cooldown: '40 sec', effectDescription: 'Ghost Protocol: Phase through any security; become untrackable.' },
    ],
  },
  'neural-interface-calibrate': {
    id: 604,
    slug: 'neural-interface-calibrate',
    name: 'Neural Interface Calibrate',
    description: 'Optimizes brain-computer interface for faster processing and reduced strain.',
    maxLevel: 10,
    tiers: [
      { level: 1, duration: '30 sec', cooldown: '60 sec', effectDescription: 'Neural processing +10%; reduce interface strain.' },
      { level: 2, duration: '35 sec', cooldown: '55 sec', effectDescription: 'Processing +15%; faster data transfer.' },
      { level: 3, duration: '40 sec', cooldown: '50 sec', effectDescription: 'Processing +20%; improved reaction time.' },
      { level: 4, duration: '45 sec', cooldown: '45 sec', effectDescription: 'Processing +25%; multi-tasking enhanced.' },
      { level: 5, duration: '50 sec', cooldown: '40 sec', effectDescription: 'Processing +30%; predict system responses.' },
      { level: 6, duration: '55 sec', cooldown: '35 sec', effectDescription: 'Processing +40%; parallel hack streams.' },
      { level: 7, duration: '60 sec', cooldown: '30 sec', effectDescription: 'Processing +50%; no mental fatigue.' },
      { level: 8, duration: '70 sec', cooldown: '27 sec', effectDescription: 'Processing +60%; time dilation effect.' },
      { level: 9, duration: '80 sec', cooldown: '24 sec', effectDescription: 'Processing +75%; superhuman cognition.' },
      { level: 10, duration: '120 sec', cooldown: '20 sec', effectDescription: 'Neural Ascension: +100% processing; think at computer speed.' },
    ],
  },
};
