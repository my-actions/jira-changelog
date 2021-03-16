const core = require('@actions/core');
const fs = require('fs');
const {AllHtmlEntities} = require("html-entities");
const {Jira, SourceControl } = require('jira-changelog');
const {generateTemplateData, renderTemplate } = require('jira-changelog/template.js');

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
    fs.accessSync(configPath);
    return localConf = require(configPath);
  } catch(e) {
    console.error("Please define the configuration file (i.e .github/changelog.js")
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
    // Release
    const release = core.getInput('release')
    if (!release && typeof config.jira.generateReleaseVersionName !== 'function') {
      const message = "You need to define the jira.generateReleaseVersionName function in your configuration, or pass the release in the action."
      core.setFailed(message);
    }

    // Get debug opts
    const debug = core.getInput('debug')
    const source = new SourceControl(config);
    const jira = new Jira(config);

    const range = config.sourceControl.defaultRange;
    console.log(`Getting range ${range.from}...${range.to} commit messages`);
    const commitLogs = await source.getCommitLogs('./', range);
    if (debug) {
      console.log('Found following commit logs:');
      console.log(commitLogs);
    }

    console.log('Generating release version');
    console.log(`Release: ${release}`);

    console.log('Generating changelog from commit messages');
    const changelog = await jira.generate(commitLogs, release);
    if (debug) {
      console.log('Changelog entry:');
      console.log(changelog);
    }

    console.log('Generating changelog');
    // Render template
    const tmplData = await generateTemplateData(config, changelog, jira.releaseVersions);
    const changelogMessage = renderTemplate(config, tmplData);

    // Output to console
    if (debug) {
      console.log('Changelog message entry:');
      console.log(entities.decode(changelogMessage));
    }
    core.setOutput('changelog', changelogMessage);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
