import { CommandArguments } from '../arguments';
import { EnvProvider } from '../interfaces';

const KEY = 'package-json';

interface PackageJsonCommandArguments extends CommandArguments {
	packageInfoPrefix: string;
}

/**
 * Loads project info from package.json.
 */
export const PackageJsonProvider: EnvProvider<PackageJsonCommandArguments> = {
	key: KEY,

	builder: (builder) => {
		builder.options({
			packageInfoPrefix: {
				group: KEY,
				alias: 'vp',
				type: 'string',
				default: '',
				describe: 'Prefix for loaded variables'
			}
		});
	},

	load: ({ env = 'development', app, packageInfoPrefix }) => {
		return {
			[`${packageInfoPrefix}ENV`]: env,

			[`${packageInfoPrefix}VERSION`]: app?.version,
			[`${packageInfoPrefix}PROJECT`]: app?.project,
			[`${packageInfoPrefix}NAME`]: app?.name,
			[`${packageInfoPrefix}TITLE`]: app?.title,
			[`${packageInfoPrefix}DESCRIPTION`]: app?.description
		};
	}
};
