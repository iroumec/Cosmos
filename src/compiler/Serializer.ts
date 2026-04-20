import type { GLSLType } from "../types/ast";

export function serializeValue(value: any, type: GLSLType): string {
    if (value === undefined || value === null) {
        if (type === 'vec3') return 'vec3(0.0)';
        if (type === 'vec2') return 'vec2(0.0)';
        if (type === 'string') return '';
        return '0.0';
    }
    
    switch (type) {
        case 'float': return Number.isInteger(value) ? `${value}.0` : `${value}`;
        case 'vec2': return typeof value === 'object' ? `vec2(${(value.x || 0).toFixed(3)}, ${(value.y || 0).toFixed(3)})` : `vec2(${value})`;
        case 'vec3': return typeof value === 'object' ? `vec3(${(value.r || 0).toFixed(3)}, ${(value.g || 0).toFixed(3)}, ${(value.b || 0).toFixed(3)})` : `vec3(${value})`;
        case 'string': return value;
        default: return '0.0';
    }
}