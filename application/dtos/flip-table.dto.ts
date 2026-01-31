// Internal DTO - Card details from repository (matches config file structure)
export interface CardDetailsDto {
  Name: string;
  Reward: string;
  iClass?: number;
  Corrupted?: boolean;
  Links?: number;
  gemLevel?: number;
  Amount?: number; // For currency cards
}
