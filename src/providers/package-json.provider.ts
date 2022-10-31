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

	load: ({ env = 'development', projectInfo, packageInfoPrefix }) => {
		const { version, project, name, title, description } = projectInfo;

		return {
			[`${packageInfoPrefix}ENV`]: env,

			[`${packageInfoPrefix}VERSION`]: version,
			[`${packageInfoPrefix}PROJECT`]: project,
			[`${packageInfoPrefix}NAME`]: name,
			[`${packageInfoPrefix}TITLE`]: title,
			[`${packageInfoPrefix}DESCRIPTION`]: description
		};
	}
};
