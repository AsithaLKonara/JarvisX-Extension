/**
 * Figma Plugin Entry Point
 */
figma.showUI(__html__, { width: 300, height: 400 });

figma.ui.onmessage = async (msg) => {
    if (msg.type === "export-ui") {
        const selection = figma.currentPage.selection[0];
        if (!selection) {
            figma.notify("Please select a frame or node to export.");
            return;
        }

        figma.ui.postMessage({
            type: "ui-tree",
            tree: serializeNode(selection)
        });
    }
};

function serializeNode(node: SceneNode): any {
    const data: any = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
    };

    if ("children" in node) {
        data.children = node.children.map(serializeNode);
    }

    // Extract color/fills if available
    if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
        data.fills = node.fills;
    }

    return data;
}
