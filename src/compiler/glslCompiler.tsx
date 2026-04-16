import type { Node, Edge } from 'reactflow';
import type { IShaderResult } from './IShaderResult';
import type { CompilerOutput } from './CompilerOutput';

export function exportToWeb(nodes: Node[], edges: Edge[], outputType: CompilerOutput): IShaderResult {
    let vertexShader = outputType.getGLSLVersion() + "\n";
    let fragmentShader = outputType.getGLSLVersion() + "\n";

    // This is important because of dependency problems.
    let sortedNodeIds = applyKahnTopologicalOrder(nodes, edges);

    // Map creation.
    const nodeMap = new Map<string, Node>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    fragmentShader += "void main() {\n";

    for (const nodeId of sortedNodeIds) {

        const node = nodeMap.get(nodeId)!;
        
        switch (node.type) {
            case 'time':
                // TODO: how WebGL and Minecrafts returns the time?
                // Is it an input variable?
                fragmentShader += `    float var_${node.id} = u_time;\n`;
                break;

            case 'multiply':

                // Entries of the node.
                const inputs = edges.filter(e => e.target === node.id);
                
                if (inputs.length === 2) {
                    const in1 = inputs[0].source; // First node.
                    const in2 = inputs[1].source; // Second node.
                    // Multiplication between the variables.
                    fragmentShader += `    float var_${node.id} = var_${in1} * var_${in2};\n`;
                }
                break;

            case 'output':

                // Fragment output.
                const finalInput = edges.find(e => e.target === node.id);
                if (finalInput) {
                    
                    // TODO: will the opacity of the color vary? I mean, will there be transparency effects in the colour? I guess so.
                    fragmentShader += `    gl_FragColor = vec4(var_${finalInput.source}, 1.0);\n`;
                }
                break;
                
            default:
                fragmentShader += `    // Unknown node!: ${node.type}\n`;
                break;
        }
    }

    fragmentShader += "}\n";

    return {
        vertex: vertexShader,
        fragment: fragmentShader,
    }
}

function applyKahnTopologicalOrder(nodes: Node[], edges: Edge[]): string[] {

    // Entring cables.
    const inDegree = new Map<string, number>();

    // Adjacents nodes (neighbours).
    const adjacentsList = new Map<string, string[]>(); 
    
    // Every node is initialized with 0 entries and 0 neighbours.
    nodes.forEach(n => {
        inDegree.set(n.id, 0);
        adjacentsList.set(n.id, []);
    });

    // The edges (cables in the UI) are filled.
    edges.forEach(edge => {

        // Source -> Edge.
        adjacentsList.get(edge.source)?.push(edge.target);

        // The entries of the target node are increased.
        const currentInDegree = inDegree.get(edge.target) || 0;
        inDegree.set(edge.target, currentInDegree + 1);
    });

    // Queue creation.
    // First, the base nodes (those with zero entries).
    // They are starting points.
    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
        if (degree === 0) queue.push(id);
    });

    // Sorted array (currently empty).
    const sortedNodeIds: string[] = [];

    // Queue processing.
    // Only the elements with zero entries are, at the start, in the queue.
    while (queue.length > 0) {

        // The first element in the queue is taken out.
        // It will be a base node.
        const currentId = queue.shift()!; 

        // The elements is added to the list.
        sortedNodeIds.push(currentId);

        // What happens if the cable between this node and its adjacents is disconected?
        adjacentsList.get(currentId)?.forEach(neighborId => {
            const newDegree = inDegree.get(neighborId)! - 1;
            inDegree.set(neighborId, newDegree);
            
            // If the adjacent node (neighbour) has no more entries, it's queued.
            // It has no more dependies to be resolved.
            if (newDegree === 0) {
                queue.push(neighborId);
            }
        });
    }

    return sortedNodeIds;
}