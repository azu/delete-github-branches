import meow from "meow";
import { deleteGitHubBranches, deleteGitHubBranchesOptions } from "./delete-github-branches";
import { parseConfig } from "./config-parse";
import path from "path";

export const cli = meow(
    `
    Usage
      $ delete-github-branches
 
    Options
      --owner Owner name for repository: **owner**/repo
      --repo  Repo name for repository: owner/**repo**
      --token GitHub Token. you can use als GITHUB_TOKEN env
      --includesBranchPatterns includes branch patterns split by comma. Default: "/^.*$/" (all)
      --excludesBranchPatterns excludes branch patterns split by comma. Default: "master,develop,dev,gh-pages"
      --stalledDays Deletable days after the branch is stalled. Default: 30
      --baseUrl GitHub API base Url.
      --dryRun if this flag is on, run dry-run mode
      --config path to config file
 
    Examples
      $ delete-github-branches --owner azu --repo delete-github-branches-test --token <TOKEN>
      $ delete-github-branches --owner azu --repo delete-github-branches-test --token <TOKEN> --includesBranchPatterns "/feature\\/.*/" --dryRun
`,
    {
        flags: {
            owner: {
                type: "string"
            },
            repo: {
                type: "string"
            },
            token: {
                type: "string"
            },
            includesBranchPatterns: {
                type: "string"
            },
            excludesBranchPatterns: {
                type: "string"
            },
            baseUrl: {
                type: "string"
            },
            dryRun: {
                type: "boolean",
                default: false
            },
            config: {
                type: "string"
            }
        },
        autoHelp: true,
        autoVersion: true
    }
);

const splitByComma = (str: string) => {
    return str.split(",").map(item => item.trim());
};

export const run = (_input = cli.input, flags = cli.flags) => {
    const config: Partial<deleteGitHubBranchesOptions> = flags.config
        ? parseConfig(path.resolve(process.cwd(), flags.config))
        : {};
    // Prefer command line flags than config file
    return deleteGitHubBranches({
        owner: flags.owner ?? config.owner,
        repo: flags.repo ?? config.repo,
        includesBranchPatterns: flags.includesBranchPatterns
            ? splitByComma(flags.includesBranchPatterns)
            : config.includesBranchPatterns,
        excludesBranchPatterns: flags.excludesBranchPatterns
            ? splitByComma(flags.excludesBranchPatterns)
            : config.excludesBranchPatterns,
        baseUrl: flags.baseUrl ?? config.baseUrl,
        token: flags.token ?? config.token ?? process.env.GITHUB_TOKEN,
        dryRun: flags.dryRun ?? config.dryRun
    });
};
