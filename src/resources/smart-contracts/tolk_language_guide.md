# Tolk Language Guide for TON Smart Contracts

## Introduction

**Tolk** is a new, modern language for TON smart contracts. It's designed to be more developer-friendly than FunC while maintaining the same power and efficiency.

---

## Why Tolk?

### Advantages

✅ **Modern Syntax** - Clean, readable code
✅ **Better Tooling** - IDE support, linters
✅ **Type Safety** - Catch errors at compile time
✅ **FunC Compatible** - Compiles to same bytecode
✅ **Easier to Learn** - More intuitive than FunC
✅ **Active Development** - Latest features first

### Comparison

| Feature | Tolk | FunC | Tact |
|---------|------|------|------|
| **Learning Curve** | Easy | Hard | Easy |
| **Low-Level Control** | Yes | Yes | No |
| **TVM Direct Access** | Yes | Yes | Limited |
| **Tooling** | Modern | Basic | Good |
| **Community** | Growing | Large | Large |

---

## Syntax Basics

### Variables

```tolk
// Global variables
global int counter;
global slice owner;

// Local variables
fun myFunction() {
    var x: int = 10;
    var name: slice = "Hello";
    var flag: bool = true;
}
```

### Types

```tolk
int        // Integer (-2^256 to 2^256-1)
bool       // Boolean (true/false)
slice      // Cell slice
cell       // Cell
builder    // Cell builder
tuple      // Tuple of values
```

### Functions

```tolk
// Private function
fun calculate(x: int, y: int): int {
    return x + y;
}

// Public function (getter)
int get_balance() method_id {
    return balance;
}

// Receive internal message
fun recv_internal(
    int my_balance,
    int msg_value,
    cell in_msg_full,
    slice in_msg_body
) impure {
    // Handle incoming messages
}
```

### Control Flow

```tolk
// If statement
if (x > 10) {
    // do something
} else {
    // do something else
}

// While loop
while (counter < 100) {
    counter += 1;
}

// For loop (using repeat)
repeat (10) {
    // execute 10 times
}
```

---

## Contract Structure

### Basic Contract

```tolk
// Counter contract example
global int counter;
global slice owner;

// Initialize contract
fun load_data() impure {
    var ds = get_data().begin_parse();
    counter = ds~load_uint(64);
    owner = ds~load_msg_addr();
}

// Save contract data
fun save_data() impure {
    set_data(
        begin_cell()
            .store_uint(counter, 64)
            .store_slice(owner)
            .end_cell()
    );
}

// Receive messages
fun recv_internal(
    int my_balance,
    int msg_value,
    cell in_msg_full,
    slice in_msg_body
) impure {
    // Load data
    load_data();
    
    // Parse message
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    // Check if bounced
    if (flags & 1) {
        return ();
    }
    
    // Get sender
    slice sender_addr = cs~load_msg_addr();
    
    // Read operation
    int op = in_msg_body~load_uint(32);
    
    // Handle operations
    if (op == 1) {  // Increment
        counter += 1;
        save_data();
    }
}

// Getter methods
int get_counter() method_id {
    load_data();
    return counter;
}

slice get_owner() method_id {
    load_data();
    return owner;
}
```

---

## Common Patterns

### Storage Management

```tolk
// Efficient storage with single cell
fun save_data(int value1, int value2, slice addr) impure {
    set_data(
        begin_cell()
            .store_uint(value1, 64)
            .store_uint(value2, 64)
            .store_slice(addr)
            .end_cell()
    );
}

fun load_data() (int, int, slice) {
    var ds = get_data().begin_parse();
    return (
        ds~load_uint(64),
        ds~load_uint(64),
        ds~load_msg_addr()
    );
}
```

### Message Sending

```tolk
// Send simple message
fun send_message(slice dest_addr, int amount, int mode) impure {
    var msg = begin_cell()
        .store_uint(0x18, 6)           // flags
        .store_slice(dest_addr)         // destination
        .store_coins(amount)            // value
        .store_uint(0, 107)             // empty payload
        .end_cell();
    
    send_raw_message(msg, mode);
}

// Send with payload
fun send_with_payload(
    slice dest_addr,
    int amount,
    cell payload
) impure {
    var msg = begin_cell()
        .store_uint(0x18, 6)
        .store_slice(dest_addr)
        .store_coins(amount)
        .store_uint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1)
        .store_ref(payload)
        .end_cell();
    
    send_raw_message(msg, 1);  // pay fees separately
}
```

### Access Control

```tolk
global slice owner;

// Only owner modifier
fun require_owner(slice sender) impure {
    load_data();
    throw_unless(401, equal_slices(sender, owner));
}

// Usage in receive function
fun recv_internal(
    int my_balance,
    int msg_value,
    cell in_msg_full,
    slice in_msg_body
) impure {
    slice cs = in_msg_full.begin_parse();
    cs~skip_bits(4);
    slice sender = cs~load_msg_addr();
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  // Admin operation
        require_owner(sender);
        // Do admin stuff
    }
}
```

### Error Handling

```tolk
// Custom error codes
const int error::unauthorized = 401;
const int error::invalid_amount = 402;
const int error::insufficient_balance = 403;

fun validate_transfer(int amount, int balance) impure {
    throw_unless(error::invalid_amount, amount > 0);
    throw_unless(error::insufficient_balance, balance >= amount);
}
```

---

## Contract Examples

### 1. Token (Jetton)

```tolk
// Simplified Jetton implementation
global int total_supply;
global slice admin;

fun load_data() (int, slice) {
    var ds = get_data().begin_parse();
    return (
        ds~load_coins(),
        ds~load_msg_addr()
    );
}

fun save_data(int supply, slice admin_addr) impure {
    set_data(
        begin_cell()
            .store_coins(supply)
            .store_slice(admin_addr)
            .end_cell()
    );
}

fun recv_internal(
    int my_balance,
    int msg_value,
    cell in_msg_full,
    slice in_msg_body
) impure {
    (total_supply, admin) = load_data();
    
    slice cs = in_msg_full.begin_parse();
    cs~skip_bits(4);
    slice sender = cs~load_msg_addr();
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 0x01) {  // Mint
        throw_unless(401, equal_slices(sender, admin));
        int amount = in_msg_body~load_coins();
        total_supply += amount;
        save_data(total_supply, admin);
    }
}

int get_total_supply() method_id {
    (total_supply, _) = load_data();
    return total_supply;
}
```

### 2. NFT Collection

```tolk
global int next_item_index;
global slice owner;
global cell content;

fun load_data() (int, slice, cell) {
    var ds = get_data().begin_parse();
    return (
        ds~load_uint(64),
        ds~load_msg_addr(),
        ds~load_ref()
    );
}

fun save_data(int index, slice owner_addr, cell content_cell) impure {
    set_data(
        begin_cell()
            .store_uint(index, 64)
            .store_slice(owner_addr)
            .store_ref(content_cell)
            .end_cell()
    );
}

fun recv_internal(
    int my_balance,
    int msg_value,
    cell in_msg_full,
    slice in_msg_body
) impure {
    (next_item_index, owner, content) = load_data();
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  // Mint NFT
        // Mint logic here
        next_item_index += 1;
        save_data(next_item_index, owner, content);
    }
}

int get_next_item_index() method_id {
    (next_item_index, _, _) = load_data();
    return next_item_index;
}
```

### 3. Staking Pool

```tolk
global int total_staked;
global int reward_rate;
global slice owner;

fun load_data() (int, int, slice) {
    var ds = get_data().begin_parse();
    return (
        ds~load_coins(),
        ds~load_uint(32),
        ds~load_msg_addr()
    );
}

fun save_data(int staked, int rate, slice owner_addr) impure {
    set_data(
        begin_cell()
            .store_coins(staked)
            .store_uint(rate, 32)
            .store_slice(owner_addr)
            .end_cell()
    );
}

fun calculate_rewards(int amount, int time) int {
    (_, reward_rate, _) = load_data();
    return (amount * reward_rate * time) / 1000000;
}

fun recv_internal(
    int my_balance,
    int msg_value,
    cell in_msg_full,
    slice in_msg_body
) impure {
    (total_staked, reward_rate, owner) = load_data();
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  // Stake
        total_staked += msg_value;
        save_data(total_staked, reward_rate, owner);
    }
    
    if (op == 2) {  // Unstake
        int amount = in_msg_body~load_coins();
        throw_unless(403, total_staked >= amount);
        total_staked -= amount;
        save_data(total_staked, reward_rate, owner);
        // Send tokens back
    }
}

int get_total_staked() method_id {
    (total_staked, _, _) = load_data();
    return total_staked;
}
```

---

## Best Practices

### 1. Gas Optimization

```tolk
// ✅ Good: Load data once
fun efficient_function() impure {
    var (val1, val2, addr) = load_data();
    // Use val1, val2, addr multiple times
    save_data(val1 + 1, val2, addr);
}

// ❌ Bad: Load data multiple times
fun inefficient_function() impure {
    var (val1, _, _) = load_data();
    var (_, val2, _) = load_data();  // Unnecessary
    var (_, _, addr) = load_data();   // Unnecessary
}
```

### 2. Error Handling

```tolk
// ✅ Good: Clear error codes
const int ERR_UNAUTHORIZED = 401;
const int ERR_INVALID_AMOUNT = 402;

throw_unless(ERR_UNAUTHORIZED, check_permission());
throw_unless(ERR_INVALID_AMOUNT, amount > 0);

// ❌ Bad: Magic numbers
throw_unless(100, check_permission());
throw_unless(200, amount > 0);
```

### 3. Message Parsing

```tolk
// ✅ Good: Check message structure
fun recv_internal(...) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    // Always check bounce flag
    if (flags & 1) {
        return ();  // Handle bounced message
    }
    
    // Continue parsing...
}

// ❌ Bad: No bounce check
fun recv_internal(...) impure {
    // Directly process without checks
}
```

### 4. Storage

```tolk
// ✅ Good: Efficient packing
fun save_data(int val, bool flag, slice addr) impure {
    set_data(
        begin_cell()
            .store_uint(val, 64)
            .store_uint(flag ? 1 : 0, 1)  // 1 bit for boolean
            .store_slice(addr)
            .end_cell()
    );
}

// ❌ Bad: Wasted space
fun save_data(int val, bool flag, slice addr) impure {
    set_data(
        begin_cell()
            .store_uint(val, 64)
            .store_uint(flag ? 1 : 0, 256)  // 256 bits for boolean!
            .store_slice(addr)
            .end_cell()
    );
}
```

---

## Testing Tolk Contracts

### Using Blueprint

```typescript
import { Blockchain } from '@ton-community/sandbox';
import { MyContract } from '../wrappers/MyContract';

describe('MyContract', () => {
    let blockchain: Blockchain;
    let contract: SandboxContract<MyContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        contract = blockchain.openContract(
            await MyContract.fromInit()
        );
    });

    it('should increment counter', async () => {
        await contract.sendIncrement();
        const counter = await contract.getCounter();
        expect(counter).toBe(1);
    });
});
```

---

## Compilation

### Using MCP

Ask the AI:
```
"Compile my Tolk contract"
"Validate Tolk syntax"
"Generate deployment script"
```

### Manual Compilation

```bash
# Using Tolk compiler (when available)
tolk MyContract.tolk -o MyContract.fif

# Convert to BOC
fift -s MyContract.fif
```

---

## Resources

### Documentation

- Tolk Guide: https://docs.ton.org/develop/smart-contracts/tolk/
- FunC→Tolk Migration: https://docs.ton.org/develop/smart-contracts/tolk/migration
- TVM Docs: https://docs.ton.org/learn/tvm-instructions/instructions

### Tools

- Tolk Compiler: Coming soon
- Blueprint: https://github.com/ton-org/blueprint
- Sandbox: https://github.com/ton-org/sandbox

### Examples

- Tolk Examples: https://github.com/ton-blockchain/tolk-examples
- TON Contracts: https://github.com/ton-blockchain/ton/tree/master/crypto/smartcont

---

## MCP Support

This MCP provides full Tolk support:

✅ **7 Contract Templates**
- Counter, Wallet, Jetton, NFT, DAO, Staking, Multisig

✅ **Compilation**
- Tolk → BOC conversion
- Syntax validation
- Error reporting

✅ **Deployment**
- Blueprint integration
- Testnet & mainnet
- Status monitoring

**Ask the AI:**
- "Generate a Tolk Jetton contract"
- "Compile my Tolk contract"
- "Validate this Tolk code"
- "Deploy my Tolk contract to testnet"

Tolk is the future of TON smart contracts! 🚀

