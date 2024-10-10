import path from "node:path";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TFile = jest.fn();
export const normalizePath = (p: string) => path.normalize(p);
