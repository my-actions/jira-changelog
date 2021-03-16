# Jira Changelog

GitHub action generating a changelog looking at Jira issue keys (i.e. [DEV-123]), in the git commit logs. 

That action is wrapping the library [jira-changelog](https://github.com/jgillick/jira-changelog) to generate the changelog. 

Please check that library to understand what you can do with that action.

## Inputs

| Input field       | Description                                                                                   | Required         | Default  |
| ----------------- |---------------------------------------------------------------------------------------------- | ---------------- |----------|
| `config`          | The configuration file to generate the changelog (see below)                                  | `true` | `.github/changelog.js` |
| `from`            | Starting git reference to get range of commits                                                |   `true` | `develop` |
| `to`              | Ending git reference to get range of commits                                                  |   `true` | `master` |
| `release`         | The release name (ie: 3.0.4). This will set the `fixVersions` of all issues found in Jira.    |  `false` | auto-generated  |
| `debug`           | Display debug messages (commits found, jitra issue found)                                     | `false` | `true` | 


## Outputs

| Input field   | Description   |
| ------------- |:-------------:| 
| `changelog`   | The changelog generated using the configuration (see below) |

# Configuration

That GitHub action expect a configuration file located at `.github/changelog.js` to run.

Please refer to the [jira-changelog](https://github.com/jgillick/jira-changelog) library for an [example](https://github.com/jgillick/jira-changelog/blob/master/changelog.config.js).


# Example usage

```yaml
on: [push]

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: Changelog
    steps:
      - name: Set Version
        run: echo ::set-env name=VERSION::1.1.1
      # To use this repository's private action, you must check out the repository
      - name: Checkout
        uses: actions/checkout@v1
      - name: Changelog
        id: changelog
        uses: my-actions/jira-changelog@v2
        with:
          config: '.github/changelog.config.js' # Required
          release: '4.5.2' # The release name (ie: 3.0.4). This will set the `fixVersions` of all issues found in Jira.
          from: 'develop'
          to: 'master'
          debug: 'false'
      - name: Get the changelog message
        run: echo "${{ steps.changelog.outputs.changelog }}"
```
