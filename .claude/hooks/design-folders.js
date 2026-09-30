// FSD slices whose design lives in a design folder of another name (layer-panel
// PLAN-5, PLAN-6). Slices not listed use a design folder of their own name.
const designFolderFor = {
  header: 'dashboard-layout',
  map: 'dashboard-layout',
  chart: 'dashboard-layout',
  layer: 'layer-panel',
  'toggle-layer': 'layer-panel',
  store: 'layer-panel',
};

// Returns the slice a src path belongs to: src/<layer>/<slice>/... for the sliced
// FSD layers, src/shared/<segment>/... for shared. null for anything else.
function sliceOf(filePath) {
  const m = filePath.replace(/\\/g, '/').match(/(?:^|\/)src\/(widgets|features|entities|shared)\/([^/]+)\//);
  return m ? m[2] : null;
}

module.exports = {
  designFolderFor,
  sliceOf,
  designFolder: (slice) => designFolderFor[slice] || slice,
};
