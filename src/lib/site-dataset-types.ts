type DataKeys<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : K;
}[keyof T];

type DataOnly<T> = Pick<T, DataKeys<T>>;

export type SharedSiteData = DataOnly<typeof import("@/lib/mock-data")>;
export type LandingSiteData = DataOnly<typeof import("@/lib/landing-data")>;

export type SiteDatasetMap = {
  shared: SharedSiteData;
  landing: LandingSiteData;
};

export type SiteDatasetKey = keyof SiteDatasetMap;
