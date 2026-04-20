import type { ICompilerTarget } from './ICompilerTarget';

export class WebTarget implements ICompilerTarget {
    
    assembleVertex(globals: string, main: string, hasEndpoint: boolean): string {
        return `
varying vec2 vUv;
vec4 vertexColor = vec4(1.0, 1.0, 1.0, 1.0); 

${globals}

void main() {
    vUv = vec2((uv.x * 2.0) - 1.0, uv.y);
${hasEndpoint 
    ? main 
    : '    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);'}
}
        `.trim();
    }

    assembleFragment(globals: string, main: string, hasEndpoint: boolean): string {
        return `
varying vec2 vUv;

${globals}

void main() {
${hasEndpoint 
    ? main 
    : '    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);'} // Fallback Magenta
}
        `.trim();
    }
}