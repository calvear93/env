import { EnvProvider } from '../interfaces';
import { AppSettingsProvider } from './app-settings.provider';
import { SecretsProvider } from './secrets.provider';
import { PackageJsonProvider } from './package-json.provider';

const IntegratedProviders: Record<string, EnvProvider<any, any>> = {
    [PackageJsonProvider.key]: PackageJsonProvider,
    [AppSettingsProvider.key]: AppSettingsProvider,
    [SecretsProvider.key]: SecretsProvider
};

const IntegratedProviderConfig = [
    {
        path: PackageJsonProvider.key,
        type: 'integrated'
    },
    {
        path: AppSettingsProvider.key,
        type: 'integrated'
    },
    {
        path: SecretsProvider.key,
        type: 'integrated'
    }
];

export { IntegratedProviders, IntegratedProviderConfig };
