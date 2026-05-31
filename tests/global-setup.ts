import { execSync } from 'node:child_process';

export default function setup(): void {
	execSync('pnpm build', { stdio: 'inherit' });
	execSync('node dist/main.js schema --root tests/env -e dev -m debug', {
		stdio: 'inherit',
	});
}
