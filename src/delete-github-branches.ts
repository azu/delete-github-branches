import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { matchPatterns } from "@textlint/regexp-string-matcher";
import dayjs from "dayjs";

export type deleteGitHubBranchesOptions = {
    /**
     * Repository owner name
     */
    owner: string;
    /**
     * Repository name
     */
    repo: string;
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
     * It means that today >= lastPushedDate + 30 and its deletable
     * if you set options.stalledDay is 0, delete the branch match patterns immediately
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
    token: string;
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
    lastPushedDate: Date;
    /**
     * associated Pull Request that status is OPEN.
     */
    associatedPullRequests: number;
};
export const getBranches = async (
    options: deleteGitHubBranchesOptions & {
        cursor?: string;
    }
): Promise<BranchResponse> => {
    const response = await graphql({
        query: `query getExistingRepoBranches($owner: String!, $repo: String!, $after: String) {
    repository(owner: $owner, name: $repo) {
      id
      name
      refs(refPrefix: "refs/heads/", first: 100, after: $after) {
        edges {
          node {
            target {
              ... on Commit {
                pushedDate
              }
            }
            branchName:name
            associatedPullRequests(states: OPEN) {
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
        after: options.cursor,
        baseUrl: options.baseUrl ?? "https://api.github.com",
        headers: {
            authorization: `token ${options.token}`
        }
    });
    if (!response) {
        return Promise.reject(new Error("Can not fetch"));
    }
    const branchItems = response.repository.refs.edges.map((edge: any) => {
        return {
            branchName: edge.node?.branchName,
            lastPushedDate: new Date(edge.node?.target?.pushedDate),
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
    token: string;
};
export const deleteBranch = (options: deleteBranchOptions) => {
    const octokit = new Octokit({
        auth: options.token,
        baseUrl: options.baseUrl ?? "https://api.github.com"
    });
    return octokit.git.deleteRef({
        owner: options.owner,
        repo: options.repo,
        ref: "heads/" + options.branchName
    });
};
export const DEFAULT_INCLUDES_BRANCH_PATTERNS = ["/^.*$/"];
export const DEFAULT_EXCLUDES_BRANCH_PATTERNS = ["master", "develop", "dev", "gh-pages"];

/**
 * Return true if it will be deleted
 * @param branchName
 * @param options
 */
export const shouldDelete = (
    branchName: string,
    options: {
        includesBranchPatterns?: string[];
        excludesBranchPatterns?: string[];
    }
) => {
    const includesBranchPatterns = options.includesBranchPatterns ?? DEFAULT_INCLUDES_BRANCH_PATTERNS;
    const excludesBranchPatterns = options.excludesBranchPatterns ?? DEFAULT_EXCLUDES_BRANCH_PATTERNS;
    const shouldNotDelete = matchPatterns(branchName, excludesBranchPatterns).length > 0;
    if (shouldNotDelete) {
        return false;
    }
    return matchPatterns(branchName, includesBranchPatterns).length > 0;
};
export type DeleteBranchResult = { branchName: string; deleted: boolean; reason?: string; error?: Error };
export const deleteGitHubBranches = async (options: deleteGitHubBranchesOptions): Promise<DeleteBranchResult[]> => {
    if (!options.token) {
        throw new Error("GITHUB_TOKEN is missing");
    }
    if (!options.owner) {
        throw new Error("owner is missing");
    }
    if (!options.repo) {
        throw new Error("repo is missing");
    }
    const stalledDays = options.stalledDays ?? 30;
    const results: DeleteBranchResult[] = [];
    const branches = await getAllBranches(options);
    for (const branch of branches) {
        // Test includes/excludes pattern
        if (
            !shouldDelete(branch.branchName, {
                includesBranchPatterns: options.includesBranchPatterns,
                excludesBranchPatterns: options.excludesBranchPatterns
            })
        ) {
            results.push({
                branchName: branch.branchName,
                deleted: false,
                reason: `This branch is ignored by includes/excludes patterns`
            });
            continue;
        }
        // if the branch has associated Pull Request, skip it
        const hasBranchAssociatedPullRequests = branch.associatedPullRequests > 0;
        if (hasBranchAssociatedPullRequests) {
            results.push({
                branchName: branch.branchName,
                deleted: false,
                reason: `This branch is matched patterns, but it has associated PullRequests: ${branch.associatedPullRequests}`
            });
            continue;
        }
        // The branch is stalled day is later than options.stalledDays
        // Today - lastPushedDate
        const diffDays = dayjs().diff(branch.lastPushedDate, "day");
        if (diffDays <= stalledDays) {
            results.push({
                branchName: branch.branchName,
                deleted: false,
                reason: `This branch is matched patterns, but this branch's stalledDays(${diffDays}) less than options.stalledDays(${stalledDays})`
            });
            continue;
        }
        // Finally, delete it if disabled dryRun
        try {
            if (!options.dryRun) {
                await deleteBranch({
                    owner: options.owner,
                    repo: options.repo,
                    branchName: branch.branchName,
                    baseUrl: options.baseUrl,
                    token: options.token
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
                reason: error.message,
                error
            });
        }
    }
    return results;
};
