export { BaseDex } from './baseDex.js';

export async function createDexInstance(dexType) {
  switch (dexType.toLowerCase()) {
    case 'zer0':
      const { Zer0Dex } = await import('./zer0Dex.js');
      return new Zer0Dex();
    case 'jaine':
      const { JaineDex } = await import('./jaineDex.js');
      return new JaineDex();
    default:
      throw new Error(`Unsupported DEX type: ${dexType}`);
  }
}

export const AVAILABLE_DEX = {
  zer0: 'Zer0 DEX',
  jaine: 'Jaine DEX',
}; 