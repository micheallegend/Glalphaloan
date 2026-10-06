import { Agent, LoanTier, Client } from '../types';

export const AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: 'Micheal Legend',
    pin: '6424325',
    password: 'Micheal500',
    role: 'Field Agent',
  },
  {
    id: 'agent-2',
    name: 'Brian Nyimbili',
    pin: '25800852',
    password: 'Brian25802026',
    role: 'Field Agent',
  },
];

export const LOAN_TIERS: LoanTier[] = [
  {
    principal: 500,
    label: 'Standard Rate',
    options: [
      { dailyAmount: 20, weeks: 8, days: 40, interest: 300, totalPayable: 800 },
      { dailyAmount: 25, weeks: 6, days: 30, interest: 250, totalPayable: 750 },
      { dailyAmount: 30, weeks: 5, days: 25, interest: 250, totalPayable: 750 },
      { dailyAmount: 35, weeks: 4, days: 20, interest: 200, totalPayable: 700 },
    ],
  },
  {
    principal: 1000,
    label: 'Double x2',
    options: [
      { dailyAmount: 40, weeks: 8, days: 40, interest: 600, totalPayable: 1600 },
      { dailyAmount: 50, weeks: 6, days: 30, interest: 500, totalPayable: 1500 },
      { dailyAmount: 60, weeks: 5, days: 25, interest: 500, totalPayable: 1500 },
      { dailyAmount: 70, weeks: 4, days: 20, interest: 400, totalPayable: 1400 },
    ],
  },
  {
    principal: 1500,
    label: 'Triple x3',
    options: [
      { dailyAmount: 60, weeks: 8, days: 40, interest: 900, totalPayable: 2400 },
      { dailyAmount: 75, weeks: 6, days: 30, interest: 750, totalPayable: 2250 },
      { dailyAmount: 90, weeks: 5, days: 25, interest: 750, totalPayable: 2250 },
      { dailyAmount: 105, weeks: 4, days: 20, interest: 600, totalPayable: 2100 },
    ],
  },
];

export const INITIAL_CLIENTS: Client[] = [];
