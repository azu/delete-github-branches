import { deleteGitHubBranches } from "../src/delete-github-branches";
import * as assert from "assert";

describe("deleteGitHubBranches", function() {
    it("will delete", async () => {
        const results = await deleteGitHubBranches({
            owner: "azu",
            repo: "delete-github-branches-test",
            excludesBranchPatterns: ["master", "develop", "/feature/.*/"],
            GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
            dryRun: true,
            stalledDays: 1
        });
        assert.deepStrictEqual(results, [
            { branchName: "develop", deleted: false, reason: "It is ignored by includes/excludes patterns" },
            { branchName: "feature/a", deleted: false, reason: "It is ignored by includes/excludes patterns" },
            { branchName: "feature/b", deleted: false, reason: "It is ignored by includes/excludes patterns" },
            { branchName: "master", deleted: false, reason: "It is ignored by includes/excludes patterns" },
            { branchName: "will-be-deleted", deleted: true }
        ]);
    });
});
