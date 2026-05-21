export type AgnicDemoProofStatus = "skipped" | "success" | "error";

export type AgnicDemoProof = {
  status: AgnicDemoProofStatus;
  generatedAt: string;
  reason: string;
  env: {
    baseUrl: string;
    model: string;
    partnerIdSet: boolean;
    accessTokenSet: boolean;
  };
  request?: {
    endpoint: string;
    method: string;
    headersSent: string[];
    prompt: string;
  };
  response?: {
    model: string;
    replyPreview: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
  error?: {
    message: string;
    httpStatus?: number;
  };
};
