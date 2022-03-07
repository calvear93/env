import { EnvProvider } from '../interfaces';
import { AppSettingsProvider } from './app-settings.provider';

const IntegratedProviders: Record<string, EnvProvider<any>> = {
    [AppSettingsProvider.key]: AppSettingsProvider
};

const IntegratedProviderConfig = [
    {
        path: AppSettingsProvider.key,
        type: 'integrated'
    }
];

export { IntegratedProviders, IntegratedProviderConfig };
