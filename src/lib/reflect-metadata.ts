import 'reflect-metadata';

export function getMetadata(metadataKey: string, target, propertyKey?: string) {
	return Reflect.getMetadata(metadataKey, target, propertyKey);
}

export function setMetadata<T>(metadataKey: string, metadataValue: T, target, propertyKey?: string): T {
	Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);
	return metadataValue;
}

export function ensureMetadata<T>(metadataKey: string, metadataValue: T, target, propertyKey?: string): T {
	const metadata = getMetadata(metadataKey, target, propertyKey);

	if (metadata === undefined) {
		return setMetadata(metadataKey, metadataValue, target, propertyKey);
	}

	return metadata;
}
