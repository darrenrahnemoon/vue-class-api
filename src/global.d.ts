interface Class { new(...args: any[]): any }

type PossibleArray<T> = T | T[];
type PossiblePromise<T> = T | Promise<T>;
type Dictionary<T> = Record<string | number, T>;
