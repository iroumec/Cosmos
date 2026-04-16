import type { CompilerOutput } from "./CompilerOutput";

export class MinecraftOutput implements CompilerOutput {

    getGLSLVersion(): string {
        return "#version 150";
    }
}