import type { CommandArguments } from '../arguments.js';
import type { EnvProvider } from '../interfaces/index.js';

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
				alias: 'vp',
				default: '',
				group: KEY,
				type: 'string',
				describe:
					'Prefix for loaded variables using package-json provider',
			},
		});
	},

	load: ({ env = 'development', packageInfoPrefix, projectInfo }) => {
		const { description, name, project, title, version } = projectInfo;

		return {
			[`${packageInfoPrefix}ENV`]: env ?? null,

			[`${packageInfoPrefix}DESCRIPTION`]: description ?? null,
			[`${packageInfoPrefix}NAME`]: name ?? null,
			[`${packageInfoPrefix}PROJECT`]: project ?? null,
			[`${packageInfoPrefix}TITLE`]: title ?? null,
			[`${packageInfoPrefix}VERSION`]: version ?? null,
		};
	},
};
