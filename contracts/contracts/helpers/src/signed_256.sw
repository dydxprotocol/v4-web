// SPDX-License-Identifier: Apache-2.0
library;

/*
    From: https://github.com/compolabs/sway-lend/blob/sway-v0.46/contracts/market/src/i256.sw
*/

pub struct Signed256 {
    pub value: u256,
    pub is_neg: bool,
}

impl From<u256> for Signed256 {
    fn from(value: u256) -> Self {
        Self {
            value, 
            is_neg: false
        }
    }
}

enum Error {
    Signed256AdditionOverflow: (),
    Signed256SubtractionOverflow: (),
    Signed256MultiplicationOverflow: (),
    Signed256DivisionOverflow: (),
}

impl core::ops::Eq for Signed256 {
    fn eq(self, other: Self) -> bool {
        self.value == other.value && self.is_neg == other.is_neg
    }
}

impl core::ops::Ord for Signed256 {
    fn gt(self, other: Self) -> bool {
        if !self.is_neg && !other.is_neg {
            self.value > other.value
        } else if !self.is_neg && other.is_neg {
            true
        } else if self.is_neg && !other.is_neg {
            false
        } else if self.is_neg && other.is_neg {
            self.value < other.value
        } else {
            revert(0)
        }
    }

    fn lt(self, other: Self) -> bool {
        if !self.is_neg && !other.is_neg {
            self.value < other.value
        } else if !self.is_neg && other.is_neg {
            false
        } else if self.is_neg && !other.is_neg {
            true
        } else if self.is_neg && other.is_neg {
            self.value > other.value
        } else {
            revert(0)
        }
    }
} 

impl Signed256 {
    /// Initializes a new, zeroed Signed256.
    pub fn new() -> Self {
        Self::from(0)
    }

    pub fn from_u256(value: u256, is_neg: bool) -> Self {
        Self {
            value, 
            is_neg
        }
    }

    pub fn ge(self, other: Self) -> bool {
        self > other || self == other
    }

    pub fn le(self, other: Self) -> bool {
        self < other || self == other
    }

    /// The size of this type in bits.
    pub fn bits() -> u32 {
        256
    }

    /// The largest value that can be represented by this integer type,
    pub fn max() -> Self {
        Self {
            value: u256::max(),
            is_neg: false,
        }
    }

    /// The smallest value that can be represented by this integer type.
    pub fn min() -> Self {
        Self {
            value: u256::min(),
            is_neg: true,
        }
    }

    /// Helper function to get a is_neg value of an unsigned number
    pub fn neg_from(value: u256) -> Self {
        Self {
            value,
            is_neg: if value == 0 { false } else { true },
        }
    }
}

impl core::ops::Add for Signed256 {
    /// Add a Signed256 to a Signed256. Panics on overflow.
    fn add(self, other: Self) -> Self {
        if !self.is_neg && !other.is_neg {
            Self::from(self.value + other.value)
        } else if self.is_neg && other.is_neg {
            Self::neg_from(self.value + other.value)
        } else if (self.value > other.value) {
            Self {
                is_neg: self.is_neg,
                value: self.value - other.value,
            }
        } else if (self.value < other.value) {
            Self {
                is_neg: other.is_neg,
                value: other.value - self.value,
            }
        } else if (self.value == other.value) {
            Self::new()
        } else {
            require(false, Error::Signed256AdditionOverflow);
            revert(0);
        }
    }
}

impl core::ops::Subtract for Signed256 {
    /// Subtract a Signed256 from a Signed256. Panics of overflow.
    fn subtract(self, other: Self) -> Self {
        if self == other { Self::new() }
        else if !self.is_neg && !other.is_neg && self.value > other.value {
            Self::from(self.value - other.value)
        } else if !self.is_neg && !other.is_neg && self.value < other.value  {
            Self::neg_from(other.value - self.value)
        } else if self.is_neg && other.is_neg && self.value > other.value {
            Self::neg_from(self.value - other.value)
        } else if self.is_neg && other.is_neg && self.value < other.value  {
            Self::from(other.value - self.value)
        } else if !self.is_neg && other.is_neg{
            Self::from(self.value + other.value)
        } else if self.is_neg && !other.is_neg {
            Self::neg_from(self.value + other.value)
        }  else {
            require(false, Error::Signed256SubtractionOverflow);
            revert(0);
        }
    }
}

impl core::ops::Multiply for Signed256 {
    /// Multiply a Signed256 with a Signed256. Panics of overflow.
    fn multiply(self, other: Self) -> Self {
        if self.value == 0 || other.value == 0{
            Self::new()
        } else if !self.is_neg == !other.is_neg {
            Self::from(self.value * other.value)
        } else if !self.is_neg != !other.is_neg{
            Self::neg_from(self.value * other.value)
        } else {
            require(false, Error::Signed256MultiplicationOverflow);
            revert(0);
        }
    }
}

impl core::ops::Divide for Signed256 {
    /// Divide a Signed256 by a Signed256. Panics if divisor is zero.
    fn divide(self, divisor: Self) -> Self {
        require(divisor != Self::new(), "ZeroDivisor");
        if self.value == 0{
            Self::new()    
        }else if !self.is_neg == !divisor.is_neg {
            Self::from(self.value / divisor.value)
        }else if !self.is_neg != !divisor.is_neg{
            Self::neg_from(self.value * divisor.value)
        } else {
            require(false, Error::Signed256DivisionOverflow);
            revert(0);
        }
    }
}

impl Signed256 {
    pub fn flip(self) -> Self {
        self * Self::neg_from(1)
    }
}