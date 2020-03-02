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
      --includesBranchPatterns includes branch patterns split by command. 
      --excludesBranchPatterns excludes branch patterns split by command. "master,develop,dev"
      --baseUrl GitHub API base Url.
      --dryRun if this flag is on, run dry-run mode
 
    Examples
      $ delete-github-branches --owner azu --repo delete-github-branches-test --token <TOKEN>
      $ delete-github-branches --owner azu --repo delete-github-branches-test --token <TOKEN> --includesBranchPatterns "/feature\/.*/" --dryRun


### Usage: Library

```ts
(async () => {
    const results = await deleteGitHubBranches({
        owner: "azu",
        repo: "delete-github-branches-test",
        excludesBranchPatterns: ["master", "develop", "/feature/.*/"],
        GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
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

Add `.env` with `GITHUB_TOKEN`

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
