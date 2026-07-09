// data.poeatlas.app - raw divinationCardDetails.json entry.
// Fields are treated as external input; validated at the boundary before use.
export interface PoeAtlasCardDetail {
  name: string;
  detailsId: string | null;
  id?: string | null;
  stackSize?: number;
  artFilename?: string;
  flavourText?: string;
  explicitModifiers?: Array<{ text: string; optional: boolean }> | null;
}
