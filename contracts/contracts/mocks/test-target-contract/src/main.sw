contract;

abi TestTargetContract {
    fn version() -> u64;
}

configurable {
    VERSION: u64 = 0,
}

impl TestTargetContract for Contract {
    fn version() -> u64 {
        VERSION
    }
}
