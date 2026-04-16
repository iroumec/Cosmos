import type { CompilerOutput } from "./CompilerOutput";

export class ThreeJSOutput implements CompilerOutput {

    getGLSLVersion(): string {
        return "#version 300 es";
    }
}