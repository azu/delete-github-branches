import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { matchPatterns } from "@textlint/regexp-string-matcher";

export type deleteGitHubBranchesOptions = {
    owner: string;
    repo: string;
    /**
     * allow list that match branch names
     * Match all branches without excludesBranchPatterns's default by default
     * It means that matches branches without ["master", "develop", "dev"]
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
     * Default: ["master", "develop", "dev"]
     */
    excludesBranchPatterns?: string[];

    /**
     * Default: 'https://api.github.com'
     */
    baseUrl?: string;
    GITHUB_TOKEN: string;
    /**
     * If `dryRun` is `true`, does not delete actually
     * Dry-run mode fetch and dump
     * Default: false
     */
    dryRun: boolean;
};
export type BranchResponse = {
    pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
    };
    items: BranchItem[];
};
export type BranchItem = {
    branchName: string;
    associatedPullRequests: number;
};
export const getBranches = async (
    options: deleteGitHubBranchesOptions & {
        cursor?: string;
    }
): Promise<BranchResponse> => {
    let paging = "";
    if (options.cursor === undefined) {
        paging = "";
    } else {
        paging = ` after: "${options.cursor}"`;
    }

    const response = await graphql({
        query: `query getExistingRepoBranches($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      id
      name
      refs(refPrefix: "refs/heads/", first: 100${paging}) {
        edges {
          node {
            branchName:name
            associatedPullRequests {
              totalCount
            }
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
    }
  }
}`,
        owner: options.owner,
        repo: options.repo,
        baseUrl: options.baseUrl ?? "https://api.github.com",
        headers: {
            authorization: `token ${options.GITHUB_TOKEN}`
        }
    });
    if (!response) {
        return Promise.reject(new Error("Can not fetch"));
    }
    const branchItems = response.repository.refs.edges.map((edge: any) => {
        return {
            branchName: edge.node?.branchName,
            associatedPullRequests: edge.node?.associatedPullRequests?.totalCount ?? 0
        };
    });
    return {
        pageInfo: response.repository.refs.pageInfo,
        items: branchItems
    };
};
export const getAllBranches = async (options: deleteGitHubBranchesOptions) => {
    const allResults: BranchItem[] = [];
    let lastCursor; // will be initialized as undefined

    for (;;) {
        const result: BranchResponse = await getBranches({
            ...options,
            cursor: lastCursor
        });
        allResults.push(...result.items);

        if (!result.pageInfo.hasNextPage) {
            break;
        }

        lastCursor = result.pageInfo.endCursor;
    }
    return allResults;
};
export type deleteBranchOptions = {
    owner: string;
    repo: string;
    branchName: string;
    /**
     * Default: 'https://api.github.com'
     */
    baseUrl?: string;
    GITHUB_TOKEN: string;
};
export const deleteBranch = (options: deleteBranchOptions) => {
    const octokit = new Octokit({
        auth: options.GITHUB_TOKEN,
        baseUrl: options.baseUrl ?? "https://api.github.com"
    });
    return octokit.git.deleteRef({
        owner: options.owner,
        repo: options.repo,
        ref: "refs/heads/" + options.branchName
    });
};

const shouldDelete = (
    branchName: string,
    {
        includesBranchPatterns,
        excludesBranchPatterns
    }: {
        includesBranchPatterns: string[];
        excludesBranchPatterns: string[];
    }
) => {
    const shouldNotDelete = matchPatterns(branchName, excludesBranchPatterns).length > 0;
    if (shouldNotDelete) {
        return false;
    }
    const shouldDelete = matchPatterns(branchName, includesBranchPatterns).length > 0;
    return shouldDelete;
};
export type DeleteBranchResult = { branchName: string; deleted: boolean; reason?: string; error?: Error };
export const deleteGitHubBranches = async (options: deleteGitHubBranchesOptions): Promise<DeleteBranchResult[]> => {
    if (!options.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN is missing");
    }
    const includesBranchPatterns = options.includesBranchPatterns ?? ["/^.*$/"];
    const excludesBranchPatterns = options.excludesBranchPatterns ?? ["master", "develop", "dev"];
    const results: DeleteBranchResult[] = [];
    const branches = await getAllBranches(options);
    for (const branch of branches) {
        // if the branch has associated Pull Request, skip it
        const hasBranchAssociatedPullRequests = branch.associatedPullRequests > 0;
        if (hasBranchAssociatedPullRequests) {
            results.push({
                branchName: branch.branchName,
                deleted: false,
                reason: `It has associated PullRequests: ${branch.associatedPullRequests}`
            });
            continue;
        }
        if (!shouldDelete(branch.branchName, { includesBranchPatterns, excludesBranchPatterns })) {
            results.push({
                branchName: branch.branchName,
                deleted: false,
                reason: `It is ignored by includes/excludes patterns`
            });
            continue;
        }
        // delete it if disabled dryRun

        try {
            if (!options.dryRun) {
                await deleteBranch({
                    owner: options.owner,
                    repo: options.repo,
                    branchName: branch.branchName,
                    baseUrl: options.baseUrl,
                    GITHUB_TOKEN: options.GITHUB_TOKEN
                });
            }
            results.push({
                branchName: branch.branchName,
                deleted: true
            });
        } catch (error) {
            results.push({
                branchName: branch.branchName,
                deleted: false,
                reason: "Error",
                error
            });
        }
    }
    return results;
};
