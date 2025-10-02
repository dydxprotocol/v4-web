library;

pub enum Error {
    PricefeedWrapperStaledPrice: (),
}

abi PricefeedWrapper {
    fn price(feedId: b256) -> u256;
}
