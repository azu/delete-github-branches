import meow from "meow";
import { deleteGitHubBranches } from "./delete-github-branches";

export const cli = meow(
    `
    Usage
      $ delete-github-branches
 
    Options
      --owner Owner name for repository: **owner**/repo
      --repo  Repo name for repository: owner/**repo**
      --token GitHub Token. you can use als GITHUB_TOKEN env
      --includesBranchPatterns includes branch patterns split by command. 
      --excludesBranchPatterns excludes branch patterns split by command. "master,develop,developer"
      --baseUrl GitHub API base Url.
      --dryRun if this flag is on, run dry-run mode
 
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
    return deleteGitHubBranches({
        owner: flags.owner,
        repo: flags.repo,
        includesBranchPatterns: flags.includesBranchPatterns ? splitByComma(flags.includesBranchPatterns) : undefined,
        excludesBranchPatterns: flags.excludesBranchPatterns ? splitByComma(flags.excludesBranchPatterns) : undefined,
        baseUrl: flags.baseUrl,
        GITHUB_TOKEN: flags.token ?? process.env.GITHUB_TOKEN,
        dryRun: flags.dryRun
    });
};
