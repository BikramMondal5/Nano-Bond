use serde::{Deserialize, Serialize};
use weil_macros::{constructor, mutate, query, smart_contract, WeilType};

pub trait BondHistory {
    fn new() -> Result<Self, String>
    where
        Self: Sized;
    async fn add_log(&mut self, log: String);
    async fn get_logs(&self) -> Vec<String>;
}

#[derive(Serialize, Deserialize, WeilType)]
pub struct BondHistoryState {
    logs: Vec<String>,
}

#[smart_contract]
impl BondHistory for BondHistoryState {
    #[constructor]
    fn new() -> Result<Self, String>
    where
        Self: Sized,
    {
        Ok(BondHistoryState { logs: Vec::new() })
    }

    #[mutate]
    async fn add_log(&mut self, log: String) {
        self.logs.push(log);
    }

    #[query]
    async fn get_logs(&self) -> Vec<String> {
        self.logs.clone()
    }
}
