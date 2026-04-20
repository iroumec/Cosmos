import type { ICompilerTarget } from './ICompilerTarget';

export class MinecraftTarget implements ICompilerTarget {
    
    private applyTranslations(globals: string, main: string) {
        let g = globals.replaceAll(/uniform float u_time;/g, '');
        g = g.replaceAll(/\bgl_FragColor\b/g, 'fragColor');

        let m = main.replaceAll(/\bu_time\b/g, 'CosmosTime');
        m = m.replaceAll(/\buv\b/g, 'UV0');
        m = m.replaceAll(/\bposition\b/g, 'Position');
        m = m.replaceAll(/\bprojectionMatrix\b/g, 'ProjMat');
        m = m.replaceAll(/\bmodelViewMatrix\b/g, 'ModelViewMat');
        m = m.replaceAll(/\bgl_FragColor\b/g, 'fragColor');

        return { translatedGlobals: g, translatedMain: m };
    }

    assembleVertex(globals: string, main: string, hasEndpoint: boolean): string {
        const { translatedGlobals, translatedMain } = this.applyTranslations(globals, main);

        return `
#version 150
in vec3 Position;
in vec4 Color;
in vec2 UV0;

uniform mat4 ModelViewMat;
uniform mat4 ProjMat;
uniform float CosmosTime;

out vec2 vUv;
out vec4 vertexColor;

${translatedGlobals}

void main() {
    vUv = UV0;
    vertexColor = Color;
${hasEndpoint 
    ? translatedMain 
    : '    gl_Position = ProjMat * ModelViewMat * vec4(Position, 1.0);'}
}
        `.trim();
    }

    assembleFragment(globals: string, main: string, hasEndpoint: boolean): string {
        const { translatedGlobals, translatedMain } = this.applyTranslations(globals, main);

        return `
#version 150
in vec2 vUv;
in vec4 vertexColor;
out vec4 fragColor;

uniform float CosmosTime;

${translatedGlobals}

void main() {
${hasEndpoint 
    ? translatedMain 
    : '    fragColor = vec4(1.0, 0.0, 1.0, 1.0);'} // Fallback Magenta
}
        `.trim();
    }
}