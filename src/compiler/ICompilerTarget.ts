export interface ICompilerTarget {
    assembleVertex(globals: string, main: string, hasEndpoint: boolean): string;
    assembleFragment(globals: string, main: string, hasEndpoint: boolean): string;
}