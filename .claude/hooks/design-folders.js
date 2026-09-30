// Feature folders whose design lives in another design folder (PLAN-3 of
// dashboard-layout). Remove an entry once that folder gets its own design docs.
const designFolderFor = {
  header: 'dashboard-layout',
  layer: 'layer-panel',
  map: 'dashboard-layout',
  chart: 'dashboard-layout',
};

module.exports = { designFolderFor, designFolder: (feature) => designFolderFor[feature] || feature };
