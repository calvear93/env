import { EnvProvider } from '../interfaces';
import { AppSettingsProvider } from './app-settings.provider';
import { SecretsProvider } from './secrets.provider';

const IntegratedProviders: Record<string, EnvProvider<any, any>> = {
    [AppSettingsProvider.key]: AppSettingsProvider,
    [SecretsProvider.key]: SecretsProvider
};

const IntegratedProviderConfig = [
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
