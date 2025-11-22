/**
 * Remark plugin to add onerror fallback to images
 */
export function remarkImageFallback() {
  return (tree) => {
    // Visit all image nodes
    function visit(node) {
      if (node.type === 'image') {
        // Add onerror attribute to image data
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        node.data.hProperties.onerror = `if (this.src !== '/assets/images/default-image.svg') { this.src = '/assets/images/default-image.svg'; this.classList.add('broken-image-fallback'); this.alt = this.alt || 'Image failed to load - showing default placeholder'; this.title = 'Original image failed to load - showing fallback'; }`;
      }

      // Visit children
      if (node.children) {
        node.children.forEach(visit);
      }
    }

    visit(tree);
  };
}
