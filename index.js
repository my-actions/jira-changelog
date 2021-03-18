const core = require('@actions/core');
const fs = require('fs');
const {AllHtmlEntities} = require("html-entities");
const {Jira, SourceControl } = require('jira-changelog');
const {generateTemplateData, renderTemplate } = require('./template.js');

/**
 * Reads the config file, merges it with the default values and returns the object.
 *
 * @param {String} cwd - The current directory
 * @return {Object} Configuration object.
 */
function readConfigFile(configPath) {
  let localConf = {};
  try {
    // Check if file exists
    const absolutePath = process.cwd() + '/' + configPath
    console.log(`Loading configuration from  ${absolutePath}`);
    fs.accessSync(absolutePath);
    return require(absolutePath);
  } catch(e) {
    const message = "Please define the configuration file (i.e .github/changelog.js)";
    core.setFailed(message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Get config file path
    const configPath = core.getInput('config')
    const config = readConfigFile(configPath);
    // Get source control range
    config.sourceControl = {
      defaultRange: {
        from: core.getInput('from'),
        to: core.getInput('to')
      }
    }
    // Setup Jira
    config.jira.api = {
        email: core.getInput('jira_email'),
        token: core.getInput('jira_token'),
    }

    // Release
    const release = core.getInput('release')
    if (!release && typeof config.jira.generateReleaseVersionName !== 'function') {
      const message = "You need to define the jira.generateReleaseVersionName function in your configuration, or pass the release in the action."
      core.setFailed(message);
    }

    // Get debug opts
    const source = new SourceControl(config);
    const jira = new Jira(config);

    const range = config.sourceControl.defaultRange;
    console.log(`Getting range ${range.from}...${range.to} commit messages`);
    const commitLogs = await source.getCommitLogs('./', range);
    console.log('Found following commit logs:');
    console.log(commitLogs);

    console.log('Generating release version');
    console.log(`Release: ${release}`);

    console.log('Generating changelog from commit messages');
    const changelog = await jira.generate(commitLogs, release);
    console.log('Changelog entry:');
    console.log(changelog);

    console.log('Generating changelog');
    // Render template
    const tmplData = await generateTemplateData(config, changelog, jira.releaseVersions);
    const changelogMessage = renderTemplate(config, tmplData);

    // Output to console
    console.log('Changelog message entry:');
    const entities = new AllHtmlEntities();
    console.log(entities.decode(changelogMessage));
    core.setOutput('changelog', changelogMessage);
  } catch (error) {
    core.setFailed(error.message);
    process.exit(1);
  }
}

main();
