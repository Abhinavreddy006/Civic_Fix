
export interface CivicAudit {
  isCivicIssue: boolean;
  error?: string;
  issueName: string;
  dimensions: string;
  severity: number;
  materialNeeded: string;
  costINR: number;
  timeToFix: string;
  formalEmail: string;
  viralTweet: string;
  targetAuthority: string;
  authorityEmail: string; // New field for direct email routing
}

export type LocationKey = string;

export interface RoutingMap {
  [key: string]: string;
}
