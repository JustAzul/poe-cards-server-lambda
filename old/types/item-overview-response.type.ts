export type ItemOverviewResponse<T> = {
  language: {
    name: string;
    translations: Record<string, unknown>;
  };
  lines: T[];
};
