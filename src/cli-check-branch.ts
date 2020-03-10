import meow from "meow";
import { deleteGitHubBranchesOptions, shouldDelete } from "./delete-github-branches";
import { parseConfig } from "./config-parse";
import path from "path";

export const cli = meow(
    `
    Usage
      $ delete-github-branches-check-branch-name [branchName]
 
    Options
      --includesBranchPatterns includes branch patterns split by comma. Default: "/^.*$/" (all)
      --excludesBranchPatterns excludes branch patterns split by comma. Default: "master,develop,dev,gh-pages"
      --config path to config file
 
    Examples
      $ delete-github-branches-check-branch-name "feature/009"
      $ echo $? # 0
      # It will be alive and exit code: 0
      $ delete-github-branches-check-branch-name "patch-101"
      $ echo $? # 1
      # It will be deleted and exit code: 1
    `,
    {
        flags: {
            includesBranchPatterns: {
                type: "string"
            },
            excludesBranchPatterns: {
                type: "string"
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

export const run = async (input = cli.input, flags = cli.flags) => {
    const config: Partial<deleteGitHubBranchesOptions> = flags.config
        ? parseConfig(path.resolve(process.cwd(), flags.config))
        : {};
    if (input.length === 0) {
        console.log("No input: should pass branchName");
        cli.showHelp();
    }
    const includesBranchPatterns = flags.includesBranchPatterns
        ? splitByComma(flags.includesBranchPatterns)
        : config.includesBranchPatterns;
    const excludesBranchPatterns = flags.excludesBranchPatterns
        ? splitByComma(flags.excludesBranchPatterns)
        : config.excludesBranchPatterns;
    const deletedBranchNames = input.filter(branchName => {
        return shouldDelete(branchName, { includesBranchPatterns, excludesBranchPatterns });
    });
    if (deletedBranchNames.length > 0) {
        return { exitStatus: 1, stderr: null, stdout: `${deletedBranchNames.join(",")} will be deleted` };
    } else {
        return { exitStatus: 0, stderr: null, stdout: `${input.join(",")} will not be deleted` };
    }
};
