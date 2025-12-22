# Writing Smart Contracts on TON

TON supports multiple languages for smart contract development. This guide focuses on best practices and common patterns.

## Language Comparison

### Tact (Recommended)
```tact
contract Counter {
    counter: Int = 0;

    receive("increment") {
        self.counter += 1;
    }

    get fun getCounter(): Int {
        return self.counter;
    }
}
```

**Pros:**
- Type-safe
- Modern syntax
- Automatic gas optimization
- Built-in TON primitives

### FunC (Low-level)
```func
() recv_internal(int msg_value, cell in_msg, slice in_msg_body) impure {
    ;; Low-level TVM operations
    return ();
}
```

**Pros:**
- Maximum control
- Ultimate optimization
- Direct TVM access

## Contract Structure

### Basic Contract Template
```tact
import "@stdlib/deploy";

contract MyContract with Deployable {
    // State variables
    owner: Address;
    balance: Int = 0;

    // Constructor
    init(owner: Address) {
        self.owner = owner;
    }

    // Public functions
    receive("deposit") {
        self.balance += ctx.value;
    }

    // Getters
    get fun getBalance(): Int {
        return self.balance;
    }

    get fun getOwner(): Address {
        return self.owner;
    }
}
```

## Message Handling

### External Messages
```tact
// Handle specific messages
receive("transfer") {
    let recipient: Address = parseAddress(msg_body);
    let amount: Int = parseInt(msg_body);

    require(amount <= self.balance, "Insufficient balance");
    require(ctx.sender == self.owner, "Unauthorized");

    self.balance -= amount;
    send(SendParameters{
        to: recipient,
        value: amount,
        mode: SendRemainingValue | SendIgnoreErrors
    });
}

// Handle any message
receive(msg: Slice) {
    // Generic message handling
    let op: Int = msg~load_uint(32);

    if (op == op_transfer) {
        // Handle transfer
    } else if (op == op_mint) {
        // Handle mint
    }
}
```

## Error Handling

### Require Statements
```tact
receive("withdraw") {
    let amount: Int = parseInt(msg_body);

    require(amount > 0, "Amount must be positive");
    require(amount <= self.balance, "Insufficient balance");
    require(ctx.sender == self.owner, "Unauthorized access");

    self.balance -= amount;
    send(SendParameters{
        to: ctx.sender,
        value: amount,
        bounce: false
    });
}
```

### Custom Errors
```tact
contract MyContract {
    // Error codes
    const ErrorCodes = {
        INSUFFICIENT_BALANCE: 101,
        UNAUTHORIZED: 102,
        INVALID_AMOUNT: 103
    };

    receive("transfer") {
        let amount: Int = parseInt(msg_body);

        if (amount <= 0) {
            throw(ErrorCodes.INVALID_AMOUNT);
        }
        if (amount > self.balance) {
            throw(ErrorCodes.INSUFFICIENT_BALANCE);
        }
        if (ctx.sender != self.owner) {
            throw(ErrorCodes.UNAUTHORIZED);
        }

        // Transfer logic
    }
}
```

## Gas Optimization

### Storage Optimization
```tact
// Bad: Multiple separate variables
userBalance: map<Address, Int>;
userNonce: map<Address, Int>;
userPermissions: map<Address, Bool>;

// Good: Single struct
struct UserData {
    balance: Int;
    nonce: Int;
    hasPermission: Bool;
}

userData: map<Address, UserData>;
```

### Computation Optimization
```tact
// Bad: Expensive loop
fun calculateTotal(users: map<Address, Int>): Int {
    let total: Int = 0;
    foreach (key, value in users) {
        total += value;
    }
    return total;
}

// Good: Cache results or use events
totalSupply: Int = 0; // Updated on each change

fun getTotalSupply(): Int {
    return self.totalSupply;
}
```

## Security Best Practices

### Access Control
```tact
contract SecureContract {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }

    // Modifier-like function
    fun requireOwner() {
        require(ctx.sender == self.owner, "Only owner");
    }

    receive("adminFunction") {
        self.requireOwner();
        // Admin logic here
    }
}
```

### Reentrancy Protection
```tact
contract NonReentrant {
    isLocked: Bool = false;

    fun nonReentrant() {
        require(!self.isLocked, "Reentrant call");
        self.isLocked = true;

        // Critical section
        // ... your logic ...

        self.isLocked = false;
    }
}
```

## Testing Contracts

### Unit Tests
```typescript
// __tests__/Counter.tact.ts
import { ContractSystem } from '@tact-lang/emulator';

describe('Counter Contract', () => {
  it('should increment counter', async () => {
    const system = await ContractSystem.create();
    const contract = await system.deploy('Counter');

    await contract.receive('increment');

    const counter = await contract.getCounter();
    expect(counter).toBe(1);
  });
});
```

### Integration Tests
```typescript
describe('Counter Integration', () => {
  it('should work with real TON network', async () => {
    // Deploy to testnet
    // Send real transactions
    // Verify on-chain state
  });
});
```

## Deployment

### Local Development
```bash
# Install Tact
npm install -g @tact-lang/compiler

# Compile contract
tact compile Counter.tact

# Test locally
npm test
```

### Testnet Deployment
```typescript
import { TonClient, WalletContractV4 } from '@ton/ton';

const client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
});

// Deploy logic here
```

## Common Patterns

### Token Contracts (Jettons)
```tact
contract JettonMaster with Deployable, Ownable {
    totalSupply: Int;
    name: String;
    symbol: String;

    get fun getJettonData(): JettonData {
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: true,
            adminAddress: self.owner,
            // ... other data
        };
    }
}
```

### NFT Contracts
```tact
contract NFTCollection with Deployable, Ownable {
    nextItemId: Int = 1;
    owner: Address;

    receive("mint") {
        // Mint NFT logic
        let itemId = self.nextItemId;
        self.nextItemId += 1;

        // Deploy NFT item
    }
}
```

### DeFi Contracts
```tact
contract AMM {
    tokenA: Address;
    tokenB: Address;
    reserveA: Int;
    reserveB: Int;

    // Constant product formula: x * y = k
    fun getAmountOut(
        amountIn: Int,
        reserveIn: Int,
        reserveOut: Int
    ): Int {
        let amountInWithFee = amountIn * 997; // 0.3% fee
        let numerator = amountInWithFee * reserveOut;
        let denominator = (reserveIn * 1000) + amountInWithFee;
        return numerator / denominator;
    }
}
```

## Debugging Contracts

### Common Issues
1. **Stack overflow**: Too many local variables
2. **Gas exhaustion**: Infinite loops or expensive operations
3. **Type errors**: Incorrect type usage
4. **Message parsing**: Incorrect slice operations

### Debugging Tools
```typescript
// Log contract state
console.log('Contract state:', await contract.getState());

// Debug transactions
const tx = await client.getTransaction(txHash);
console.log('Transaction details:', tx);
```

## Best Practices Summary

1. **Use Tact** for most contracts (type safety, modern syntax)
2. **Handle errors** appropriately with require statements
3. **Optimize gas** usage through storage and computation efficiency
4. **Implement security** measures (access control, reentrancy protection)
5. **Test thoroughly** with both unit and integration tests
6. **Follow standards** for tokens, NFTs, and DeFi protocols
7. **Document code** with clear comments and function descriptions

Remember: Smart contracts handle real value, so security and correctness are paramount. Always test extensively and consider formal verification for complex contracts.
