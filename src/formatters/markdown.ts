import { DeleteBranchResult } from "../delete-github-branches";

export const formatMarkdown = ({
    owner,
    repo,
    results
}: {
    owner: string;
    repo: string;
    results: DeleteBranchResult[];
}): string => {
    const activeResults = results.filter(result => {
        return !result.deleted;
    });
    const deletedResults = results.filter(result => {
        return result.deleted;
    });
    const formatResult = (result: DeleteBranchResult): string => {
        return `- [${result.branchName}](https://github.com/${owner}/${repo}/tree/${result.branchName})
> ${
            result.reason
                ? result.reason
                      .split("\n")
                      .map(line => `> ${line}`)
                      .join("\n")
                : "No reason"
        }`;
    };
    return `
# Deleted Branches
    
${deletedResults.map(formatResult).join("\n")}    

# Active Branches
    
${activeResults.map(formatResult).join("\n")}    

`;
};
