/**
 * Nodejs pre-hook
 */

const sys = require('util')
const exec = require('child_process').exec;
const readline = require('readline');

const FILE_PATH_INDEX = 2; // pwd as arg in alias

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const runCMD = (cmd, infoMessage, errorMessage, showOutput) => new Promise((res, rej) => {
  console.log(infoMessage);

  return exec(cmd, (error, stdout, stderr) => {
    return error
      ? rej(`${errorMessage}: ${error}`)
      : res(showOutput ? stdout : '')
  })
})

const getFilePath = (args) => new Promise((res, rej) => {
  console.log('# Checking that filepath is correct...')

  return args[FILE_PATH_INDEX] && args[FILE_PATH_INDEX].indexOf('module') !== -1
    ? res()
    : rej('You are not in the project module folder')
})

const askYesOrNoQuestion = (question, yesAnswer) => new Promise(res =>
  rl.question(`${question} (Y/N) `, (answer) => res(answer === 'Y')))

const exitProgram = () => {
  process.exit()
  rl.close();
};

console.log('\nHello friend, I will now fix everything before your commit!\n')

getFilePath(process.argv)
  .then(() => runCMD('git stash', '# Stashing your changes...', 'Could not stash your changes'))
  .then(() => runCMD('git pull', '# Pulling latest changes from server...', 'Could not pull from server'))
  .then(() => runCMD('rm -rf node_modules yarn.lock', '# Removing node_modules...', 'Could not remove node_modules'))
  .then(() => runCMD('yarn install', '# Installing fresh npm dependencies...', 'Could not install fresh dependencies'))
  .then(() => runCMD('yarn test', '# Running unit tests from latest pull...', 'The pull before your changes caused an error'))
  .then(() => runCMD('git stash apply', '# Applying your changes...', 'Could not apply your changes'))
  .then(() => runCMD('yarn test', '# Running unit tests with your changes included...', 'Your changes caused an error'))
  .then(() => runCMD('yarn build', '# Building production code locally...', 'Could not build production code'))
  .then(() => console.log('\nEverything went OK! You can now add and commit your changes :)\n'))
  .then(() => askYesOrNoQuestion('Run component tests also?'))
  .then(runComponentTests => runComponentTests ? runComponentTests : exitProgram())
  .then(() => {
    runCMD('yarn run start:prod &', '\n# Starting prod server locally', 'Could not start prod server') // Start in background
    return runCMD('cd ../component-tests && yarn test &', '# Running component tests', 'Failure in component tests', true);
  })
  .then(componentTestOutput => {
    console.log(componentTestOutput)
    exitProgram();
  })
  // Run tests
  .catch(err => {
    console.error('\tERROR:', err)
    exitProgram();
  })
