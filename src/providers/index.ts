import { EnvProvider } from '../interfaces';
import { AppSettingsProvider } from './app-settings.provider';
import { SecretsProvider } from './secrets.provider';
import { PackageJsonProvider } from './package-json.provider';
import { LocalProvider } from './local.provider';

const IntegratedProviders: Record<string, EnvProvider<any, any>> = {
	[PackageJsonProvider.key]: PackageJsonProvider,
	[AppSettingsProvider.key]: AppSettingsProvider,
	[SecretsProvider.key]: SecretsProvider,
	[LocalProvider.key]: LocalProvider
};

const IntegratedProviderConfig = [
	{
		path: PackageJsonProvider.key
	},
	{
		path: AppSettingsProvider.key
	},
	{
		path: SecretsProvider.key
	},
	{
		path: LocalProvider.key
	}
];

export { IntegratedProviders, IntegratedProviderConfig };
