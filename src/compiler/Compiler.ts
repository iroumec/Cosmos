import type { ShaderGraph, NodeType } from '../types/ast';
import type { ICompilerTarget } from './ICompilerTarget';
import { NodeRegistry } from '../core/registry';
import { serializeValue } from './Serializer';

export function compileShader(graph: ShaderGraph, target: ICompilerTarget) {

    return {
        vertexShader: compileGraph(graph, target, 'OUTPUT_VERT', true),
        fragmentShader: compileGraph(graph, target, 'OUTPUT_FRAG', false)
    };
}

function compileGraph(graph: ShaderGraph, target: ICompilerTarget, endpointType: NodeType, isVertex: boolean): string {

    const endpointNode = graph.nodes.find(n => n.type === endpointType);
    const hasEndpoint = !!endpointNode;
    
    // Variables for recolecting the code.
    const generatedNodes = new Set<string>(); // Here the already processed nodes are saved, so they are not processed again.
    const globalFunctions = new Set<string>(); // Some nodes needs to incrust functions.
    const bodyLines: string[] = [];

    // If the output node exists, it is traversed backwards.
    if (endpointNode) {
        traverseBackwards(graph, generatedNodes, globalFunctions, bodyLines, endpointNode.id);
    }

    // Final ensambling.
    let globalsString = Array.from(globalFunctions).join('\n\n');
    let mainString = bodyLines.join('\n');

    if (isVertex) {
        return target.assembleVertex(globalsString, mainString, hasEndpoint);
    } else {
        return target.assembleFragment(globalsString, mainString, hasEndpoint);
    }
}

// TODO: Simplify it.
function traverseBackwards(graph: ShaderGraph, generatedNodes: Set<string>, globalFunctions: Set<string>, bodyLines: string[], currentNodeId: string) {

    // If the node was already processed, early return.
    if (generatedNodes.has(currentNodeId)) return;
    
    // Node obtention base on its id.
    const node = graph.nodes.find(n => n.id === currentNodeId);
    if (!node) return;

    // The strategy of the node is obtained.
    const strategy = NodeRegistry[node.type];
    if (!strategy) {
        bodyLines.push(`    // Unknow node: ${node.type}`);
        return;
    }

    // Before processing the current node, all its dependencies are processed.
    node.inputs.forEach(input => {
        const connection = graph.connections.find(c => c.targetNodeId === currentNodeId && c.targetPortId === input.id);
        if (connection) traverseBackwards(graph, generatedNodes, globalFunctions, bodyLines, connection.sourceNodeId);
    });

    // Once reached this part of the code, all dependencies were processed
    // and its code was generated.

    // If the node needs the use of functions, they are extracted.
    if (strategy.globalFunctions) {
        globalFunctions.add(strategy.globalFunctions);
    }

    // Cables resolution.
    const resolveInput = (portId: string): string => {
        const inputDef = node.inputs.find(i => i.id === portId);
        const expectedType = inputDef?.type || 'float';
        const connection = graph.connections.find(c => c.targetNodeId === currentNodeId && c.targetPortId === portId);

        if (connection) {
            const sourceNode = graph.nodes.find(n => n.id === connection.sourceNodeId);
            const sourceOutput = sourceNode?.outputs.find(o => o.id === connection.sourcePortId);
            const actualType = sourceOutput?.type || 'float';
            
            let sourceVarName = `node_${connection.sourceNodeId.replaceAll('-', '_')}`;
            if (sourceNode && sourceNode.outputs.length > 1) {
                sourceVarName = `${sourceVarName}_${connection.sourcePortId}`; // This is useful in case the node has multiple exists.
            }

            // Type adaptation.
            if (expectedType === 'vec3' && actualType === 'float') return `vec3(${sourceVarName})`;
            return sourceVarName;
        }

        // If there is no cable, the default value written in the interface is used.
        return serializeValue(inputDef?.value, expectedType);
    };

    // GLSL code generation.
    const varName = `node_${node.id.replaceAll('-', '_')}`;
    const nodeCode = strategy.generateCode({ node, varName, resolveInput });
    bodyLines.push(nodeCode);
    
    generatedNodes.add(currentNodeId);
}