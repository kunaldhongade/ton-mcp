/**
 * Tolk Smart Contract Templates
 * Tolk is the new programming language for TON smart contracts
 */

export const tolkContractTemplates = {
  counter: `
// Simple Counter Contract in Tolk
// Tolk syntax is similar to TypeScript/Rust

global int counter;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {  // Bounced message
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  // Increment
        counter += 1;
    } elseif (op == 2) {  // Decrement
        counter -= 1;
    }
}

int get_counter() method_id {
    return counter;
}
`,

  jetton: `
// Jetton Master Contract in Tolk
// Token implementation following TEP-74 standard

global slice admin_address;
global cell jetton_wallet_code;
global slice jetton_content;
global int total_supply;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 21) {  // Mint
        throw_unless(73, equal_slices(sender_addr, admin_address));
        
        int amount = in_msg_body~load_coins();
        slice to_address = in_msg_body~load_msg_addr();
        
        total_supply += amount;
        
        // Send jettons to recipient
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(to_address)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0x178d4519, 32)  // Internal transfer op
            .store_uint(query_id, 64)
            .store_coins(amount)
            .end_cell();
        
        send_raw_message(msg, 1);
    }
}

(int, int, slice, cell, cell) get_jetton_data() method_id {
    return (total_supply, -1, admin_address, jetton_content, jetton_wallet_code);
}

slice get_wallet_address(slice owner_address) method_id {
    cell state_init = calculate_jetton_wallet_state_init(owner_address, my_address(), jetton_wallet_code);
    return calculate_address_by_state_init(state_init);
}
`,

  nft: `
// NFT Item Contract in Tolk
// Following TEP-62 standard

global int index;
global slice collection_address;
global slice owner_address;
global cell content;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 0x5fcc3d14) {  // Transfer
        throw_unless(401, equal_slices(sender_addr, owner_address));
        
        slice new_owner = in_msg_body~load_msg_addr();
        slice response_destination = in_msg_body~load_msg_addr();
        int custom_payload = in_msg_body~load_int(1);
        int forward_amount = in_msg_body~load_coins();
        
        owner_address = new_owner;
        
        if (forward_amount > 0) {
            var msg = begin_cell()
                .store_uint(0x10, 6)
                .store_slice(new_owner)
                .store_coins(forward_amount)
                .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
                .store_uint(0x05138d91, 32)  // Ownership assigned
                .store_uint(query_id, 64)
                .store_slice(owner_address)
                .end_cell();
            
            send_raw_message(msg, 1);
        }
    }
}

(int, int, slice, slice, cell) get_nft_data() method_id {
    return (1, index, collection_address, owner_address, content);
}
`,

  wallet: `
// Wallet V5 Contract in Tolk
// Modern wallet with advanced features

global int seqno;
global int subwallet_id;
global slice public_key;
global int extensions;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    // Empty receive for accepting transfers
}

fun recv_external(slice in_msg) impure {
    var signature = in_msg~load_bits(512);
    var cs = in_msg;
    
    var (subwallet_id_from_msg, valid_until, msg_seqno) = (cs~load_uint(32), cs~load_uint(32), cs~load_uint(32));
    
    throw_if(35, valid_until <= now());
    throw_unless(33, subwallet_id_from_msg == subwallet_id);
    throw_unless(34, msg_seqno == seqno);
    
    accept_message();
    
    cs~touch();
    
    while (cs.slice_refs()) {
        var mode = cs~load_uint(8);
        send_raw_message(cs~load_ref(), mode);
    }
    
    seqno += 1;
}

int get_seqno() method_id {
    return seqno;
}

int get_subwallet_id() method_id {
    return subwallet_id;
}

slice get_public_key() method_id {
    return public_key;
}
`,

  dao: `
// DAO Governance Contract in Tolk
// Decentralized autonomous organization

global cell proposals;
global slice admin;
global int proposal_count;
global int quorum_percentage;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 1) {  // Create proposal
        slice title = in_msg_body~load_ref().begin_parse();
        slice description = in_msg_body~load_ref().begin_parse();
        int voting_period = in_msg_body~load_uint(32);
        
        proposal_count += 1;
        
        cell proposal = begin_cell()
            .store_uint(proposal_count, 32)
            .store_slice(sender_addr)
            .store_ref(begin_cell().store_slice(title).end_cell())
            .store_ref(begin_cell().store_slice(description).end_cell())
            .store_uint(now() + voting_period, 32)
            .store_uint(0, 32)  // yes votes
            .store_uint(0, 32)  // no votes
            .store_int(0, 1)    // executed
            .end_cell();
        
        proposals~udict_set(32, proposal_count, proposal.begin_parse());
    }
    elseif (op == 2) {  // Vote
        int proposal_id = in_msg_body~load_uint(32);
        int vote = in_msg_body~load_int(1);  // 1 = yes, 0 = no
        
        (cell proposal, int found) = proposals.udict_get?(32, proposal_id);
        throw_unless(404, found);
        
        // Update vote count
        // Implementation details...
    }
    elseif (op == 3) {  // Execute proposal
        throw_unless(401, equal_slices(sender_addr, admin));
        
        int proposal_id = in_msg_body~load_uint(32);
        
        // Execute approved proposal
        // Implementation details...
    }
}

(int, int) get_proposal_votes(int proposal_id) method_id {
    (cell proposal, int found) = proposals.udict_get?(32, proposal_id);
    throw_unless(404, found);
    
    slice ps = proposal.begin_parse();
    ps~skip_bits(32 + 267 + 32);  // Skip id, creator, voting period
    
    int yes_votes = ps~load_uint(32);
    int no_votes = ps~load_uint(32);
    
    return (yes_votes, no_votes);
}
`,

  staking: `
// Staking Pool Contract in Tolk
// Stake TON tokens and earn rewards

global slice owner;
global int total_staked;
global int reward_rate;
global cell stakers;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {  // Stake
        int amount = msg_value;
        throw_unless(100, amount > 0);
        
        (cell staker_data, int found) = stakers.udict_get?(267, sender_addr.slice_hash());
        
        if (found) {
            slice sd = staker_data.begin_parse();
            int current_stake = sd~load_coins();
            int last_claim = sd~load_uint(32);
            
            // Calculate pending rewards
            int pending = calculate_rewards(current_stake, last_claim, now());
            
            // Update stake
            staker_data = begin_cell()
                .store_coins(current_stake + amount)
                .store_uint(now(), 32)
                .store_coins(pending)
                .end_cell();
        } else {
            staker_data = begin_cell()
                .store_coins(amount)
                .store_uint(now(), 32)
                .store_coins(0)
                .end_cell();
        }
        
        stakers~udict_set(267, sender_addr.slice_hash(), staker_data.begin_parse());
        total_staked += amount;
    }
    elseif (op == 2) {  // Unstake
        (cell staker_data, int found) = stakers.udict_get?(267, sender_addr.slice_hash());
        throw_unless(404, found);
        
        slice sd = staker_data.begin_parse();
        int staked_amount = sd~load_coins();
        int last_claim = sd~load_uint(32);
        int pending_rewards = sd~load_coins();
        
        // Calculate final rewards
        int total_rewards = pending_rewards + calculate_rewards(staked_amount, last_claim, now());
        
        // Send back stake + rewards
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(staked_amount + total_rewards)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .end_cell();
        
        send_raw_message(msg, 1);
        
        stakers~udict_delete?(267, sender_addr.slice_hash());
        total_staked -= staked_amount;
    }
    elseif (op == 3) {  // Claim rewards
        (cell staker_data, int found) = stakers.udict_get?(267, sender_addr.slice_hash());
        throw_unless(404, found);
        
        slice sd = staker_data.begin_parse();
        int staked_amount = sd~load_coins();
        int last_claim = sd~load_uint(32);
        int pending_rewards = sd~load_coins();
        
        int total_rewards = pending_rewards + calculate_rewards(staked_amount, last_claim, now());
        
        // Send rewards
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(total_rewards)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .end_cell();
        
        send_raw_message(msg, 1);
        
        // Reset claim time
        staker_data = begin_cell()
            .store_coins(staked_amount)
            .store_uint(now(), 32)
            .store_coins(0)
            .end_cell();
        
        stakers~udict_set(267, sender_addr.slice_hash(), staker_data.begin_parse());
    }
}

int calculate_rewards(int amount, int from_time, int to_time) inline {
    int duration = to_time - from_time;
    return (amount * reward_rate * duration) / (365 * 24 * 60 * 60 * 100);
}

(int, int, int) get_staker_info(slice staker_addr) method_id {
    (cell staker_data, int found) = stakers.udict_get?(267, staker_addr.slice_hash());
    
    if (~ found) {
        return (0, 0, 0);
    }
    
    slice sd = staker_data.begin_parse();
    int staked_amount = sd~load_coins();
    int last_claim = sd~load_uint(32);
    int pending_rewards = sd~load_coins();
    
    int current_rewards = pending_rewards + calculate_rewards(staked_amount, last_claim, now());
    
    return (staked_amount, current_rewards, last_claim);
}

int get_total_staked() method_id {
    return total_staked;
}
`,

  multisig: `
// Multisig Wallet Contract in Tolk
// Multi-signature wallet for enhanced security

global int n;  // total signers
global int k;  // required signatures
global cell signers;
global int next_order_seqno;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    // Accept transfers
}

fun recv_external(slice in_msg) impure {
    int order_seqno = in_msg~load_uint(32);
    throw_unless(33, order_seqno == next_order_seqno);
    
    int valid_until = in_msg~load_uint(32);
    throw_if(35, valid_until <= now());
    
    int signer_index = in_msg~load_uint(8);
    var signature = in_msg~load_bits(512);
    
    // Verify signer
    (cell signer, int found) = signers.udict_get?(8, signer_index);
    throw_unless(34, found);
    
    slice s = signer.begin_parse();
    int pubkey = s~load_uint(256);
    
    // Verify signature
    throw_unless(35, check_signature(slice_hash(in_msg), signature, pubkey));
    
    accept_message();
    
    // Count signatures
    int sig_count = in_msg~load_uint(8);
    
    if (sig_count >= k) {
        // Execute transaction
        cell msg = in_msg~load_ref();
        int mode = in_msg~load_uint(8);
        send_raw_message(msg, mode);
        
        next_order_seqno += 1;
    }
}

(int, int, int) get_multisig_data() method_id {
    return (n, k, next_order_seqno);
}

int get_signer_pubkey(int index) method_id {
    (cell signer, int found) = signers.udict_get?(8, index);
    throw_unless(404, found);
    
    return signer.begin_parse()~load_uint(256);
}
`,

  amm: `
// AMM (Automated Market Maker) Contract in Tolk
// Decentralized exchange with constant product formula (x * y = k)

global int reserve0;
global int reserve1;
global int total_liquidity;
global cell liquidity_providers;
global slice token0_address;
global slice token1_address;

fun recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {
    slice cs = in_msg_full.begin_parse();
    int flags = cs~load_uint(4);
    
    if (flags & 1) {
        return ();
    }
    
    slice sender_addr = cs~load_msg_addr();
    int op = in_msg_body~load_uint(32);
    int query_id = in_msg_body~load_uint(64);
    
    if (op == 1) {  // Add Liquidity
        int amount0 = in_msg_body~load_coins();
        int amount1 = in_msg_body~load_coins();
        
        throw_unless(100, amount0 > 0);
        throw_unless(101, amount1 > 0);
        
        int liquidity = 0;
        
        if (total_liquidity == 0) {
            // First liquidity provider
            liquidity = sqrt(amount0 * amount1);
        } else {
            // Calculate liquidity based on existing reserves
            int liquidity0 = (amount0 * total_liquidity) / reserve0;
            int liquidity1 = (amount1 * total_liquidity) / reserve1;
            liquidity = min(liquidity0, liquidity1);
        }
        
        throw_unless(102, liquidity > 0);
        
        // Update reserves
        reserve0 += amount0;
        reserve1 += amount1;
        total_liquidity += liquidity;
        
        // Store liquidity for provider
        (cell provider_data, int found) = liquidity_providers.udict_get?(267, sender_addr.slice_hash());
        
        if (found) {
            int current_liquidity = provider_data.begin_parse()~load_coins();
            provider_data = begin_cell()
                .store_coins(current_liquidity + liquidity)
                .end_cell();
        } else {
            provider_data = begin_cell()
                .store_coins(liquidity)
                .end_cell();
        }
        
        liquidity_providers~udict_set(267, sender_addr.slice_hash(), provider_data.begin_parse());
        
        // Send confirmation
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0x01, 32)  // Liquidity added
            .store_uint(query_id, 64)
            .store_coins(liquidity)
            .end_cell();
        
        send_raw_message(msg, 64);
    }
    elseif (op == 2) {  // Remove Liquidity
        int liquidity = in_msg_body~load_coins();
        
        (cell provider_data, int found) = liquidity_providers.udict_get?(267, sender_addr.slice_hash());
        throw_unless(404, found);
        
        int provider_liquidity = provider_data.begin_parse()~load_coins();
        throw_unless(103, liquidity <= provider_liquidity);
        
        // Calculate amounts to return
        int amount0 = (liquidity * reserve0) / total_liquidity;
        int amount1 = (liquidity * reserve1) / total_liquidity;
        
        // Update reserves
        reserve0 -= amount0;
        reserve1 -= amount1;
        total_liquidity -= liquidity;
        
        // Update provider liquidity
        if (liquidity == provider_liquidity) {
            liquidity_providers~udict_delete?(267, sender_addr.slice_hash());
        } else {
            provider_data = begin_cell()
                .store_coins(provider_liquidity - liquidity)
                .end_cell();
            liquidity_providers~udict_set(267, sender_addr.slice_hash(), provider_data.begin_parse());
        }
        
        // Send tokens back
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0x02, 32)  // Liquidity removed
            .store_uint(query_id, 64)
            .store_coins(amount0)
            .store_coins(amount1)
            .end_cell();
        
        send_raw_message(msg, 64);
    }
    elseif (op == 3) {  // Swap Token0 for Token1
        int amount0_in = in_msg_body~load_coins();
        throw_unless(100, amount0_in > 0);
        
        // Constant product formula: x * y = k
        // amount1_out = (amount0_in * reserve1) / (reserve0 + amount0_in)
        // Apply 0.3% fee
        int amount0_in_with_fee = amount0_in * 997;
        int numerator = amount0_in_with_fee * reserve1;
        int denominator = (reserve0 * 1000) + amount0_in_with_fee;
        int amount1_out = numerator / denominator;
        
        throw_unless(104, amount1_out > 0);
        throw_unless(105, amount1_out < reserve1);
        
        // Update reserves
        reserve0 += amount0_in;
        reserve1 -= amount1_out;
        
        // Send Token1 to user
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0x03, 32)  // Swap completed
            .store_uint(query_id, 64)
            .store_coins(amount1_out)
            .end_cell();
        
        send_raw_message(msg, 64);
    }
    elseif (op == 4) {  // Swap Token1 for Token0
        int amount1_in = in_msg_body~load_coins();
        throw_unless(100, amount1_in > 0);
        
        // Constant product formula with 0.3% fee
        int amount1_in_with_fee = amount1_in * 997;
        int numerator = amount1_in_with_fee * reserve0;
        int denominator = (reserve1 * 1000) + amount1_in_with_fee;
        int amount0_out = numerator / denominator;
        
        throw_unless(104, amount0_out > 0);
        throw_unless(105, amount0_out < reserve0);
        
        // Update reserves
        reserve1 += amount1_in;
        reserve0 -= amount0_out;
        
        // Send Token0 to user
        var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(sender_addr)
            .store_coins(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0x03, 32)  // Swap completed
            .store_uint(query_id, 64)
            .store_coins(amount0_out)
            .end_cell();
        
        send_raw_message(msg, 64);
    }
}

// Helper functions
int sqrt(int x) inline {
    if (x == 0) {
        return 0;
    }
    int z = (x + 1) / 2;
    int y = x;
    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    }
    return y;
}

int min(int a, int b) inline {
    return a < b ? a : b;
}

// Get methods
(int, int, int) get_reserves() method_id {
    return (reserve0, reserve1, total_liquidity);
}

int get_liquidity(slice provider_addr) method_id {
    (cell provider_data, int found) = liquidity_providers.udict_get?(267, provider_addr.slice_hash());
    
    if (~ found) {
        return 0;
    }
    
    return provider_data.begin_parse()~load_coins();
}

int get_amount_out(int amount_in, int reserve_in, int reserve_out) method_id {
    throw_unless(100, amount_in > 0);
    throw_unless(101, reserve_in > 0);
    throw_unless(102, reserve_out > 0);
    
    int amount_in_with_fee = amount_in * 997;
    int numerator = amount_in_with_fee * reserve_out;
    int denominator = (reserve_in * 1000) + amount_in_with_fee;
    
    return numerator / denominator;
}
`,
};

export function getTolkTemplate(contractType: string): string {
  return (
    tolkContractTemplates[contractType as keyof typeof tolkContractTemplates] ||
    tolkContractTemplates.counter
  );
}

export function getAllTolkTemplateNames(): string[] {
  return Object.keys(tolkContractTemplates);
}
