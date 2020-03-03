import { deleteGitHubBranchesOptions } from "./delete-github-branches";

export const parseConfig = (filePath: string): Partial<deleteGitHubBranchesOptions> => {
    try {
        return require(filePath);
    } catch (error) {
        console.error(error);
        throw new Error("Can not load config file" + filePath);
    }
};
