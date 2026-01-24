export interface FigmaNode {
    id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    x: number;
    y: number;
    fills?: any[];
    children?: FigmaNode[];
    characters?: string; // For text nodes
}

export function figmaToHtml(node: FigmaNode): string {
    const styles: string[] = [
        `width: ${node.width}px`,
        `height: ${node.height}px`,
        `position: relative`,
        `display: flex`,
        `flex-direction: column`
    ];

    if (node.fills && node.fills.length > 0) {
        const fill = node.fills[0];
        if (fill.type === 'SOLID') {
            const { r, g, b } = fill.color;
            styles.push(`background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${fill.opacity || 1})`);
        }
    }

    const styleStr = styles.join('; ');
    const childrenHtml = node.children ? node.children.map(figmaToHtml).join('') : (node.characters || '');

    // Semantic Mapping
    let tag = 'div';
    const name = node.name.toLowerCase();
    if (name.includes('button')) tag = 'button';
    if (name.includes('input') || name.includes('field')) tag = 'input';
    if (node.type === 'TEXT') tag = 'span';

    return `<${tag} id="${node.id}" class="${node.type.toLowerCase()}" style="${styleStr}">${childrenHtml}</${tag}>`;
}

export function extractDesignTokens(node: FigmaNode): any {
    const tokens: any = {
        colors: new Set<string>(),
        typography: new Set<string>()
    };

    function walk(n: FigmaNode) {
        if (n.fills) {
            n.fills.forEach(f => {
                if (f.type === 'SOLID') {
                    tokens.colors.add(`rgba(${Math.round(f.color.r * 255)}, ${Math.round(f.color.g * 255)}, ${Math.round(f.color.b * 255)}, ${f.opacity || 1})`);
                }
            });
        }
        if (n.children) n.children.forEach(walk);
    }

    walk(node);
    return {
        colors: Array.from(tokens.colors),
        typography: Array.from(tokens.typography)
    };
}
