import chalk from 'chalk';
import Prompt from 'commander';

import { incrementPackageVersion, Resource, Terminal } from '../src/';

/**
 * **Usage**
 *
 * ```bash
 * npx ts-node publish\publish.ts
 * ```
 */

Terminal.title('PUBLISH');
 
Prompt
  // .requiredOption('-f, --folder <folder>', 'Ruta absoluta de la carpeta i nom del component.')
  // .option('-c, --commit <dir>', 'Descripció pel commit')
  .option('-v, --verbose', 'Log verbose')
;
Prompt.parse(process.argv);

if (Prompt.verbose) { console.log('Arguments: ', Prompt.opts()); }

(async () => {

  incrementPackageVersion();
  
  if (Resource.exists(`dist`)) {
    Terminal.log(`Eliminant la carpeta de distribució ${chalk.bold(`dist`)}.`);
    Resource.removeSync(`dist`);
  }
  
  Terminal.log(chalk.bold(`Compilant projecte typescript`));
  await Terminal.run(`tsc`);
  
  Terminal.log(`npm publish`);
  await Terminal.run(`npm publish`);

})();
