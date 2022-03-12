interface Class<T> { new(...args: any[]): T }

type PossibleArray<T> = T | T[];
type PossiblePromise<T> = T | Promise<T>;
type Dictionary<T> = Record<string | number, T>;
