import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    // Create the mocha test runner
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 30_000, // generous timeout for PDF generation tests
    });

    const testsRoot = path.resolve(__dirname);

    // Find all test files
    const files = await glob('**/*.test.js', { cwd: testsRoot });

    for (const file of files) {
        mocha.addFile(path.resolve(testsRoot, file));
    }

    return new Promise<void>((resolve, reject) => {
        mocha.run((failures) => {
            if (failures > 0) {
                reject(new Error(`${failures} test(s) failed.`));
            } else {
                resolve();
            }
        });
    });
}
