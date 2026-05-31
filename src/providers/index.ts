import type { EnvProvider } from '../interfaces/index.js';
import { AppSettingsProvider } from './app-settings.provider.js';
import { LocalProvider } from './local.provider.js';
import { PackageJsonProvider } from './package-json.provider.js';
import { SecretsProvider } from './secrets.provider.js';

const IntegratedProviders: Record<string, EnvProvider<any, any>> = {
	[AppSettingsProvider.key]: AppSettingsProvider,
	[LocalProvider.key]: LocalProvider,
	[PackageJsonProvider.key]: PackageJsonProvider,
	[SecretsProvider.key]: SecretsProvider,
};

// order defines provider load + merge precedence (later entries win):
// package-json (base info) < app-settings < secrets < local (highest).
// Do NOT alphabetize this array — the sequence is semantic.
const IntegratedProviderConfig = [
	{
		path: PackageJsonProvider.key,
	},
	{
		path: AppSettingsProvider.key,
	},
	{
		path: SecretsProvider.key,
	},
	{
		path: LocalProvider.key,
	},
];

export { IntegratedProviderConfig, IntegratedProviders };
