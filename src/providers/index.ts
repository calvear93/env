import { EnvProvider } from '../interfaces';
import { AppSettingsProvider } from './app-settings.provider';

const IntegratedProviders: Record<string, EnvProvider<any>> = {
    ['app-settings']: AppSettingsProvider
};

const IntegratedProviderConfig = [
    {
        path: 'app-settings',
        type: 'integrated'
    }
];

export { IntegratedProviders, IntegratedProviderConfig };
