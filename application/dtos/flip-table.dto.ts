// Input DTO - Card details from repository
export interface CardDetailsDto {
  Name: string;
  Reward: string;
  iClass?: number;
  Corrupted?: boolean;
  Links?: number;
  gemLevel?: number;
  Amount?: number; // For currency cards
}
