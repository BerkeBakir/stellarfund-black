#![no_std]
use soroban_sdk::{
    contract, contractclient, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

#[contractclient(name = "ReputationClient")]
pub trait ReputationInterface {
    fn record_success(env: Env, campaign: Address, creator: Address);
}

#[derive(Clone, Copy, PartialEq)]
#[contracttype]
pub enum Status {
    Active = 0,
    Releasing = 1,
    Completed = 2,
    Refunding = 3,
}

/// One tranche of the escrow. The sum of all milestone `amount`s equals the
/// campaign goal; each releases at most once, in order.
#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub amount: i128,
    pub released: bool,
}

#[contracttype]
pub enum DataKey {
    Creator,
    Goal,
    Deadline,
    Token,
    Reputation,
    Factory,
    Status,
    TotalRaised,
    TotalReleased,
    Milestones,
    ReleasedCount,
    Contribution(Address),
}

#[contract]
pub struct Campaign;

#[contractimpl]
impl Campaign {
    pub fn init(
        env: Env,
        creator: Address,
        goal: i128,
        deadline: u64,
        token: Address,
        reputation: Address,
        factory: Address,
        milestones: Vec<i128>,
    ) {
        if env.storage().instance().has(&DataKey::Creator) {
            panic!("already initialized");
        }
        if goal <= 0 {
            panic!("goal must be positive");
        }
        if milestones.is_empty() {
            panic!("milestones required");
        }
        // Validate: every tranche positive, and the schedule sums to the goal.
        let mut sum: i128 = 0;
        let mut schedule: Vec<Milestone> = Vec::new(&env);
        for amount in milestones.iter() {
            if amount <= 0 {
                panic!("milestone must be positive");
            }
            sum += amount;
            schedule.push_back(Milestone {
                amount,
                released: false,
            });
        }
        if sum != goal {
            panic!("milestones must sum to goal");
        }

        let s = env.storage().instance();
        s.set(&DataKey::Creator, &creator);
        s.set(&DataKey::Goal, &goal);
        s.set(&DataKey::Deadline, &deadline);
        s.set(&DataKey::Token, &token);
        s.set(&DataKey::Reputation, &reputation);
        s.set(&DataKey::Factory, &factory);
        s.set(&DataKey::Status, &Status::Active);
        s.set(&DataKey::TotalRaised, &0i128);
        s.set(&DataKey::TotalReleased, &0i128);
        s.set(&DataKey::Milestones, &schedule);
        s.set(&DataKey::ReleasedCount, &0u32);
    }

    pub fn contribute(env: Env, from: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let s = env.storage().instance();
        let status: Status = s.get(&DataKey::Status).unwrap();
        let deadline: u64 = s.get(&DataKey::Deadline).unwrap();
        if status != Status::Active || env.ledger().timestamp() > deadline {
            panic!("campaign is not active");
        }

        let token: Address = s.get(&DataKey::Token).unwrap();
        let this = env.current_contract_address();
        token::TokenClient::new(&env, &token).transfer(&from, &this, &amount);

        let ckey = DataKey::Contribution(from.clone());
        let prev: i128 = env.storage().persistent().get(&ckey).unwrap_or(0);
        env.storage().persistent().set(&ckey, &(prev + amount));

        let total: i128 = s.get(&DataKey::TotalRaised).unwrap();
        let new_total = total + amount;
        s.set(&DataKey::TotalRaised, &new_total);

        env.events().publish((symbol_short!("contrib"), from), amount);

        let goal: i128 = s.get(&DataKey::Goal).unwrap();
        if new_total >= goal {
            env.events().publish((symbol_short!("goal_met"),), new_total);
        }
    }

    /// Release milestone `index` to the creator. Releases must happen in order
    /// (index must equal the number already released). Requires the goal to be
    /// met and the deadline passed. The final release marks the campaign
    /// Completed and records success in the Reputation contract.
    pub fn release(env: Env, index: u32) {
        let s = env.storage().instance();
        let creator: Address = s.get(&DataKey::Creator).unwrap();
        creator.require_auth();

        let status: Status = s.get(&DataKey::Status).unwrap();
        let deadline: u64 = s.get(&DataKey::Deadline).unwrap();
        let goal: i128 = s.get(&DataKey::Goal).unwrap();
        let total: i128 = s.get(&DataKey::TotalRaised).unwrap();
        if status != Status::Active && status != Status::Releasing {
            panic!("campaign is not releasable");
        }
        if env.ledger().timestamp() <= deadline {
            panic!("deadline not reached");
        }
        if total < goal {
            panic!("goal not reached");
        }

        let released_count: u32 = s.get(&DataKey::ReleasedCount).unwrap();
        if index != released_count {
            panic!("releases must be sequential");
        }

        let mut schedule: Vec<Milestone> = s.get(&DataKey::Milestones).unwrap();
        let mut milestone = schedule.get(index).expect("milestone index out of range");
        if milestone.released {
            panic!("milestone already released");
        }
        milestone.released = true;
        let amount = milestone.amount;
        schedule.set(index, milestone);

        let token: Address = s.get(&DataKey::Token).unwrap();
        let this = env.current_contract_address();
        token::TokenClient::new(&env, &token).transfer(&this, &creator, &amount);

        let total_released: i128 = s.get(&DataKey::TotalReleased).unwrap();
        s.set(&DataKey::TotalReleased, &(total_released + amount));
        let new_count = released_count + 1;
        s.set(&DataKey::ReleasedCount, &new_count);
        s.set(&DataKey::Milestones, &schedule);

        env.events()
            .publish((symbol_short!("release"), index), amount);

        if new_count == schedule.len() {
            s.set(&DataKey::Status, &Status::Completed);
            let reputation: Address = s.get(&DataKey::Reputation).unwrap();
            ReputationClient::new(&env, &reputation).record_success(&this, &creator);
            env.events()
                .publish((symbol_short!("completed"), creator), total);
        } else {
            s.set(&DataKey::Status, &Status::Releasing);
        }
    }

    pub fn refund(env: Env, caller: Address) {
        caller.require_auth();
        let s = env.storage().instance();
        let status: Status = s.get(&DataKey::Status).unwrap();
        let deadline: u64 = s.get(&DataKey::Deadline).unwrap();
        let goal: i128 = s.get(&DataKey::Goal).unwrap();
        let total: i128 = s.get(&DataKey::TotalRaised).unwrap();
        if env.ledger().timestamp() <= deadline {
            panic!("deadline not reached");
        }
        if total >= goal {
            panic!("goal was reached");
        }
        if status == Status::Completed {
            panic!("already completed");
        }
        s.set(&DataKey::Status, &Status::Refunding);

        let ckey = DataKey::Contribution(caller.clone());
        let amount: i128 = env.storage().persistent().get(&ckey).unwrap_or(0);
        if amount <= 0 {
            panic!("nothing to refund");
        }
        env.storage().persistent().set(&ckey, &0i128);

        let token: Address = s.get(&DataKey::Token).unwrap();
        let this = env.current_contract_address();
        token::TokenClient::new(&env, &token).transfer(&this, &caller, &amount);

        env.events().publish((symbol_short!("refunded"), caller), amount);
    }

    /// (creator, goal, deadline, total_raised, status, milestone_count, released_count)
    pub fn summary(env: Env) -> (Address, i128, u64, i128, u32, u32, u32) {
        let s = env.storage().instance();
        let creator: Address = s.get(&DataKey::Creator).unwrap();
        let goal: i128 = s.get(&DataKey::Goal).unwrap();
        let deadline: u64 = s.get(&DataKey::Deadline).unwrap();
        let total: i128 = s.get(&DataKey::TotalRaised).unwrap();
        let status: Status = s.get(&DataKey::Status).unwrap();
        let schedule: Vec<Milestone> = s.get(&DataKey::Milestones).unwrap();
        let released_count: u32 = s.get(&DataKey::ReleasedCount).unwrap();
        (
            creator,
            goal,
            deadline,
            total,
            status as u32,
            schedule.len(),
            released_count,
        )
    }

    pub fn milestones(env: Env) -> Vec<Milestone> {
        env.storage().instance().get(&DataKey::Milestones).unwrap()
    }

    pub fn total_released(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalReleased).unwrap()
    }

    pub fn contribution_of(env: Env, who: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Contribution(who))
            .unwrap_or(0)
    }
}

mod test;
