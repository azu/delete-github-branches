import { DeleteBranchResult } from "../delete-github-branches";

export const formatJSON = ({ results }: { owner: string; repo: string; results: DeleteBranchResult[] }): string => {
    return JSON.stringify(results, null, 4);
};
