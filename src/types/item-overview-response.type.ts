export type ItemOverviewResponse<T> = {
  lines: T[];
  language: {
    name: string;
    translations: Record<string, unknown>;
  };
};
