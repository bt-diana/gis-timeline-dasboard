// FSD slices whose design lives in a design folder of another name (layer-panel
// PLAN-5, PLAN-6, PLAN-8). Slices not listed use a design folder of their own name.
const designFolderFor = {
  header: 'dashboard-layout',
  map: 'dashboard-layout',
  chart: 'dashboard-layout',
  layer: 'layer-panel',
  'toggle-layer': 'layer-panel',
  store: 'layer-panel',
};

// Returns the gated slice a src path belongs to: src/<layer>/<slice>/... for the
// sliced FSD layers, and src/shared/store/... as "store". null for anything else.
function sliceOf(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const sliced = normalized.match(/(?:^|\/)src\/(?:widgets|features|entities)\/([^/]+)\//);
  if (sliced) return sliced[1];
  return /(?:^|\/)src\/shared\/store\//.test(normalized) ? 'store' : null;
}

module.exports = {
  designFolderFor,
  sliceOf,
  designFolder: (slice) => (Object.hasOwn(designFolderFor, slice) ? designFolderFor[slice] : slice),
};
