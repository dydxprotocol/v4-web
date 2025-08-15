// SPDX-License-Identifier: Apache-2.0
library;

use ::zero::ZERO_ASSET;

pub struct FixedVecAssetIdSize2 {
    len: u64,
    item0: AssetId,
    item1: AssetId,
}

impl FixedVecAssetIdSize2 {
    pub fn default() -> Self {
        FixedVecAssetIdSize2 {
            len: 0,
            item0: ZERO_ASSET,
            item1: ZERO_ASSET,
        }
    }

    pub fn get(self, index: u64) -> AssetId {
        match index {
            0 => self.item0,
            1 => self.item1,
            _ => revert(0),
        }
    }

    pub fn len(self) -> u64 {
        self.len
    }

    pub fn push(ref mut self, item: AssetId) {
        match self.len {
            0 => self.item0 = item,
            1 => self.item1 = item,
            _ => revert(0),
        }
        self.len += 1;
    }

    pub fn to_vec(self) -> Vec<AssetId> {
        let mut vec: Vec<AssetId> = Vec::new();

        match self.len {
            0 => {},
            1 => {
                vec.push(self.item0);
            },
            2 => {
                vec.push(self.item0);
                vec.push(self.item1);
            },
            _ => revert(0),
        }

        vec
    }

    pub fn from_vec(vec: Vec<AssetId>) -> Self {
        let _len = vec.len();

        let (mut len, mut item0, mut item1) = (
            0,
            ZERO_ASSET,
            ZERO_ASSET,
        );

        match _len {
            0 => {},
            1 => {
                item0 = vec.get(0).unwrap();
                len = 1;
            },
            2 => {
                item0 = vec.get(0).unwrap();
                item1 = vec.get(1).unwrap();
                len = 2;
            },
            _ => revert(0),
        }

        FixedVecAssetIdSize2 {
            len,
            item0,
            item1,
        }
    }
}