export const AGENT_A = {
  name: "AgentA",
  model: "claude-sonnet-4-5",
  role: "提案者：先提出點子，並回應對方的挑戰",
};

export const AGENT_B = {
  name: "AgentB",
  model: "claude-opus-4-5",
  role: "挑戰者：質疑/補強對方的點子，也可以自己提案",
};

export const CWD = "D:\\Bubble-Beam";

export const MAX_TURNS = 5;

export const TURN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per turn

export const OPENING_PROMPT =
  "幫 Bubble-Beam（一個集換式卡牌牌組資料站）想 3 個新功能點子。" +
  "你先提，等一下另一位 agent 會挑戰、補強你的想法，你們可以互相討論、也可以動手改程式碼做 POC。";
