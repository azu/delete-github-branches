# delete-github-branches

Delete GitHub Branches that match patterns.

## Features

- Can define `includesBranchPatterns`
- Can define `excludesBranchPatterns`
- If the branch has associated Pull Requests, Does not delete the branch
- Have `dryRun` mode

## Install

Install with [npm](https://www.npmjs.com/):

    npm install delete-github-branches

## Usage: CLI


    Usage
      $ delete-github-branches
 
    Options
      --owner Owner name for repository: **owner**/repo
      --repo  Repo name for repository: owner/**repo**
      --token GitHub Token. you can use als GITHUB_TOKEN env
      --includesBranchPatterns includes branch patterns split by comma. Default: "/^.*$/" (all)
      --excludesBranchPatterns excludes branch patterns split by comma. Default: "master,develop,dev,gh-pages"
      --stalledDays Deletable days after the branch is stalled. Default: 30
      --format Output formatter. Available: "markdown", "json". Default: "markdown"
      --baseUrl GitHub API base Url.
      --dryRun if this flag is on, run dry-run mode
      --config path to config file
 
    Examples
      $ delete-github-branches --owner azu --repo delete-github-branches-test --token <TOKEN>
      $ delete-github-branches --owner azu --repo delete-github-branches-test --token <TOKEN> --includesBranchPatterns "/feature\/.*/" --dryRun

### Config File

Config file is following JSON format.

All property is optional and its can be combined with command line flags.

```ts
{
    /**
     * Repository owner name
     */
    owner?: string;
    /**
     * Repository name
     */
    repo?: string;
    /**
     * allow list that match branch names
     * Match all branches without excludesBranchPatterns's default by default
     * It means that matches branches without ["master", "develop", "dev", "gh-pages"]
     *
     * You can use RegExp-like string for this list
     * https://github.com/textlint/regexp-string-matcher#regexp-like-string
     * Default: ["/^.*$/"]
     */
    includesBranchPatterns?: string[];
    /**
     * Deny list that match branch names
     * You can use RegExp-like string for this list
     * https://github.com/textlint/regexp-string-matcher#regexp-like-string
     * Default: ["master", "develop", "dev", "gh-pages"]
     */
    excludesBranchPatterns?: string[];
    /**
     * You can set deletable stalled days after the branch is last pushed
     * Delete branches that are stalled 30 days by default
     * if today >= lastPushedDate + 30, its deletable
     * Default: 30
     */
    stalledDays?: number;
    /**
     * Default: 'https://api.github.com'
     */
    baseUrl?: string;
    /**
     * GitHub Token
     */
    token?: string;
    /**
     * If `dryRun` is `true`, does not delete actually
     * Dry-run mode fetch and dump
     * Default: false
     */
    dryRun?: boolean;
}
```

For example, `delete-github-branches.json` is following config.

`delete-github-branches.json`:

```json
{
    "includesBranchPatterns":  ["/^.*$/"],
    "excludesBranchPatterns": ["master", "develop", "dev", "gh-pages", "/^feature\/.*$/"]
}
```

And you can pass other options as command line flags 

```shell script
$ GITHUB_TOKEN=$GH_TOKEN delete-github-branches --owner azu --repo delete-github-branches-test --config ./delete-github-branches.json
```

## Usage: Library

```ts
(async () => {
    const results = await deleteGitHubBranches({
        owner: "azu",
        repo: "delete-github-branches-test",
        excludesBranchPatterns: ["master", "develop", "/feature/.*/"],
        token: process.env.token!,
        dryRun: true // <= dry run mode
    });
    assert.deepStrictEqual(results, [
        { branchName: "develop", deleted: false, reason: "It is ignored by includes/excludes patterns" },
        { branchName: "feature/a", deleted: false, reason: "It is ignored by includes/excludes patterns" },
        { branchName: "feature/b", deleted: false, reason: "It is ignored by includes/excludes patterns" },
        { branchName: "master", deleted: false, reason: "It is ignored by includes/excludes patterns" },
        { branchName: "will-be-deleted", deleted: true }
    ]);
})()
```

## Changelog

See [Releases page](https://github.com/azu/delete-github-branches/releases).

## Running tests

Add `.env` with `token`

```
GITHUB_TOKEN=XXXX
```

Run tests

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/delete-github-branches/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- [github/azu](https://github.com/azu)
- [twitter/azu_re](https://twitter.com/azu_re)

## License

MIT © azu
