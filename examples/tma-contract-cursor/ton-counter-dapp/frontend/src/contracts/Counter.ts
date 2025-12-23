import { Address, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';

export type CounterConfig = {};

export function counterConfigToCell(config: CounterConfig): Cell {
  return Cell.EMPTY;
}

export const CounterOpCodes = {
  increment: 0x25938561,
  decrement: 0xbc7c5c0b,
} as const;

export class Counter implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address) {
    return new Counter(address);
  }

  static createFromConfig(config: CounterConfig, code: Cell, workchain = 0) {
    const data = counterConfigToCell(config);
    const init = { code, data };
    return new Counter(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: Cell.EMPTY,
    });
  }

  async sendIncrement(provider: ContractProvider, via: Sender, value: bigint = toNano('0.05')) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: Cell.fromBase64('te6cckEBAQEAAgAAAEAAAAA='), // "increment" message
    });
  }

  async sendDecrement(provider: ContractProvider, via: Sender, value: bigint = toNano('0.05')) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: Cell.fromBase64('te6cckEBAQEAAgAAAEAAAAA='), // "decrement" message
    });
  }

  async getCounter(provider: ContractProvider): Promise<number> {
    const result = await provider.get('getCounter', []);
    return result.stack.readNumber();
  }
}

