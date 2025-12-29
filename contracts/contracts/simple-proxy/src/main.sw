contract;

use std::execution::run_external;
use src5::{AccessError, State};
use src14::{SRC14, SRC14_TARGET_STORAGE, SRC14Extension};
use upgradability::{
    _proxy_owner,
    _proxy_target,
    _set_proxy_owner,
    _set_proxy_target,
    only_proxy_owner,
};

enum SimpleProxyError {
    AlreadyInitialized: (),
    InvalidOwner: (),
}

configurable {
    DEPLOYER: Address = Address::zero(),
}

storage {
    SRC14 {
        target in SRC14_TARGET_STORAGE: Option<ContractId> = None,
        /// The [State] of the proxy owner.
        ///
        /// # Additional Information
        ///
        /// `proxy_owner` is stored at sha256("storage_SRC14_1")
        proxy_owner in 0xbb79927b15d9259ea316f2ecb2297d6cc8851888a98278c0a2e03e1a091ea754: State = State::Uninitialized,
    },
}

abi SimpleProxy : SRC14 + SRC14Extension {
    #[storage(write)]
    fn initialize_proxy(owner: Identity, target: ContractId);

    #[storage(write)]
    fn set_proxy_owner(new_owner: Identity);
}

impl SRC14 for Contract {
    #[storage(read, write)]
    fn set_proxy_target(new_target: ContractId) {
        only_proxy_owner();
        _set_proxy_target(new_target);
    }

    #[storage(read)]
    fn proxy_target() -> Option<ContractId> {
        _proxy_target()
    }
}

impl SRC14Extension for Contract {
    #[storage(read)]
    fn proxy_owner() -> State {
        _proxy_owner()
    }
}

impl SimpleProxy for Contract {
    #[storage(write)]
    fn initialize_proxy(owner: Identity, target: ContractId) {
        require(
            msg_sender()
                .unwrap() == Identity::Address(DEPLOYER),
            AccessError::NotOwner,
        );
        require(
            storage::SRC14
                .target
                .read()
                .is_none(),
            SimpleProxyError::AlreadyInitialized,
        );
        require(
            owner != Identity::Address(Address::zero()),
            SimpleProxyError::InvalidOwner,
        );

        storage::SRC14.target.write(Some(target));
        storage::SRC14.proxy_owner.write(State::Initialized(owner));
    }

    #[storage(write)]
    fn set_proxy_owner(new_owner: Identity) {
        _set_proxy_owner(State::Initialized(new_owner));
    }
}

#[fallback, storage(read)]
fn fallback() {
    run_external(storage::SRC14.target.read().unwrap())
}
